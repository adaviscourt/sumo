#!/usr/bin/env python3
"""Scrape makuuchi rikishi data from the official Sumo Association website.

This script is intentionally conservative: throttled requests, retry-friendly,
and writes a timestamped snapshot to data/rikishi/raw.
"""

from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import urljoin, urlparse, parse_qs

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.sumo.or.jp"
ALT_BASE_URL = "https://sumo.or.jp"
SEARCH_URL = "https://www.sumo.or.jp/EnSumoDataRikishi/search/"
Banzuke_URL = "https://www.sumo.or.jp/EnHonbashoBanzuke/index/"
DEFAULT_BANZUKE_AJAX_URL = "https://www.sumo.or.jp/EnHonbashoBanzuke/indexAjax/1/1/"
USER_AGENT = "sumo-trainer/0.1 (+local tooling)"
REQUEST_DELAY_SEC = 0.6
TIMEOUT_SEC = 20

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "rikishi" / "raw"
IMAGE_DIR = ROOT / "public" / "images" / "rikishi"


@dataclass
class RikishiRow:
  sumoAssociationId: str
  shikonaEn: str
  shikonaJp: Optional[str]
  heya: Optional[str]
  birthDate: Optional[str]
  heightCm: Optional[int]
  weightKg: Optional[int]
  currentRank: str
  imagePath: Optional[str]
  profileUrl: str
  snapshotDate: str


def session() -> requests.Session:
  s = requests.Session()
  s.headers.update({"User-Agent": USER_AGENT})
  return s


def sleep_throttle() -> None:
  time.sleep(REQUEST_DELAY_SEC)


def to_int(text: str) -> Optional[int]:
  digits = re.sub(r"[^0-9]", "", text or "")
  if not digits:
    return None
  return int(digits)


def fetch_html(s: requests.Session, url: str) -> BeautifulSoup:
  response = s.get(url, timeout=TIMEOUT_SEC)
  response.raise_for_status()
  sleep_throttle()
  return BeautifulSoup(response.text, "html.parser")


def extract_profile_links_from_html(html: str) -> List[str]:
  text = (html or "").strip()

  # Some endpoints may return JSON with an HTML payload field.
  if text.startswith("{") and "table_html" in text:
    try:
      payload = json.loads(text)
      if isinstance(payload, dict):
        candidate = payload.get("table_html") or payload.get("html") or payload.get("data")
        if isinstance(candidate, str) and candidate.strip():
          html = candidate
    except Exception:
      pass

  soup = BeautifulSoup(html, "html.parser")
  links = []

  for a in soup.select("a[href*='EnSumoDataRikishi/profile']"):
    href = a.get("href")
    if not href:
      continue
    links.append(urljoin(BASE_URL, href))

  if not links:
    # Fallback for script-embedded links.
    matches = re.findall(r"https?://www\.sumo\.or\.jp/EnSumoDataRikishi/profile/[0-9]+/?", html)
    links.extend(matches)

  if not links:
    # Fallback for relative links in JS strings.
    matches = re.findall(r"/EnSumoDataRikishi/profile/[0-9]+/?", html)
    links.extend(urljoin(BASE_URL, m) for m in matches)

  return dedupe_links(links)


def extract_banzuke_entries(payload_text: str) -> List[dict]:
  text = (payload_text or "").strip()
  if not text.startswith("{"):
    return []

  try:
    payload = json.loads(text)
  except Exception:
    return []

  if not isinstance(payload, dict):
    return []

  table = payload.get("BanzukeTable")
  if isinstance(table, list):
    return [row for row in table if isinstance(row, dict)]

  return []


def dedupe_links(links: List[str]) -> List[str]:
  # Deduplicate while preserving order
  seen = set()
  unique = []
  for link in links:
    if link in seen:
      continue
    seen.add(link)
    unique.append(link)

  return unique


def resolve_banzuke_ajax_url(s: requests.Session) -> str:
  """Read current basho ID from the banzuke shell page and build AJAX URL."""
  try:
    landing = s.get(Banzuke_URL, timeout=TIMEOUT_SEC)
    landing.raise_for_status()
    sleep_throttle()
  except Exception:
    return DEFAULT_BANZUKE_AJAX_URL

  soup = BeautifulSoup(landing.text, "html.parser")
  hidden = soup.select_one("#bashoId")
  basho_id = hidden.get("value").strip() if hidden and hidden.get("value") else ""
  if basho_id.isdigit():
    return f"{BASE_URL}/EnHonbashoBanzuke/indexAjax/{basho_id}/1/"

  return DEFAULT_BANZUKE_AJAX_URL


def ajax_endpoint_candidates(basho_id: str) -> List[str]:
  hosts = [BASE_URL, ALT_BASE_URL]
  candidates: List[str] = []

  for host in hosts:
    candidates.extend(
      [
        f"{host}/EnHonbashoBanzuke/indexAjax/{basho_id}/1/",
        f"{host}/EnHonbashoBanzuke/indexAjax/{basho_id}/",
        f"{host}/EnHonbashoBanzuke/indexAjax/1/{basho_id}/",
        f"{host}/EnHonbashoBanzuke/indexAjax/1/{basho_id}",
        f"{host}/EnHonbashoBanzuke/indexAjax/{basho_id}/1/1/",
        f"{host}/EnHonbashoBanzuke/indexAjax/1/1/",
      ]
    )

  return dedupe_links(candidates)


def find_makuuchi_profile_links(
  s: requests.Session,
) -> Tuple[List[str], Dict[str, dict], Optional[str], Optional[str]]:
  resolved_ajax = resolve_banzuke_ajax_url(s)
  print(f"Using banzuke AJAX endpoint: {resolved_ajax}")

  basho_id_match = re.search(r"/indexAjax/([0-9]+)/", resolved_ajax)
  basho_id = basho_id_match.group(1) if basho_id_match else "1"

  candidates = ajax_endpoint_candidates(basho_id) + [
    f"{SEARCH_URL}?banzuke=1",
    Banzuke_URL,
  ]
  banzuke_rows_by_id: Dict[str, dict] = {}
  matched_payload: Optional[str] = None
  matched_url: Optional[str] = None

  for url in candidates:
    try:
      response = s.get(
        url,
        timeout=TIMEOUT_SEC,
        headers={
          "X-Requested-With": "XMLHttpRequest",
          "Referer": Banzuke_URL,
        },
      )
      response.raise_for_status()
      sleep_throttle()
      links = extract_profile_links_from_html(response.text)
      banzuke_entries = extract_banzuke_entries(response.text)
      if banzuke_entries:
        for row in banzuke_entries:
          rikishi_id = row.get("rikishi_id")
          if rikishi_id is None:
            continue
          rid = str(rikishi_id)
          banzuke_rows_by_id[rid] = row

        # Build synthetic profile URLs when JSON has rows but no anchors.
        if not links:
          links = [
            f"{BASE_URL}/EnSumoDataRikishi/profile/{rid}/"
            for rid in banzuke_rows_by_id.keys()
          ]

      if links:
        print(f"Discovered {len(links)} profile links from: {url}")
        matched_payload = response.text
        matched_url = url
        return links, banzuke_rows_by_id, matched_payload, matched_url
      if "indexAjax" in url:
        debug_ajax = RAW_DIR / "debug-last-ajax-response.html"
        debug_ajax.write_text(response.text, encoding="utf-8")
    except Exception as exc:
      print(f"Link discovery failed for {url}: {exc}")

  return [], banzuke_rows_by_id, matched_payload, matched_url


def parse_profile_id(profile_url: str) -> str:
  parsed = urlparse(profile_url)
  q = parse_qs(parsed.query)
  for key in ("id", "rikishi", "rikishiId"):
    if key in q and q[key]:
      return q[key][0]

  match = re.search(r"/profile/(\d+)", parsed.path)
  if match:
    return match.group(1)

  raise ValueError(f"Unable to parse profile id from URL: {profile_url}")


def text_or_none(node) -> Optional[str]:
  if not node:
    return None
  text = node.get_text(" ", strip=True)
  return text or None


def parse_profile(
  s: requests.Session, profile_url: str, snapshot_iso: str, allow_image_download: bool = False
) -> RikishiRow:
  soup = fetch_html(s, profile_url)
  full_text = soup.get_text(" ", strip=True)
  if "URLに誤りがあります" in full_text:
    raise ValueError("Profile page returned URL error content")

  # The official page structure can vary, so use broad selectors + label matching.
  title = text_or_none(soup.select_one("h1, h2")) or "Unknown"
  shikona_en = title.replace("\n", " ").strip()

  # Key-value style table extraction.
  fields = {}
  for row in soup.select("tr"):
    th = row.select_one("th")
    td = row.select_one("td")
    if not th or not td:
      continue
    key = th.get_text(" ", strip=True).lower()
    value = td.get_text(" ", strip=True)
    fields[key] = value

  shikona_jp = fields.get("shikona")
  heya = fields.get("heya")
  rank = fields.get("rank") or fields.get("banzuke") or "Maegashira"
  birth_date = fields.get("date of birth")
  height_cm = to_int(fields.get("height", ""))
  weight_kg = to_int(fields.get("weight", ""))

  image_url = None
  if allow_image_download:
    image = soup.select_one("img[src*='rikishi'], img[src*='sumodata'], img[src*='sumo_data']")
    if image and image.get("src"):
      image_url = urljoin(BASE_URL, image.get("src"))

  image_path = None
  profile_id = parse_profile_id(profile_url)
  if image_url:
    image_path = download_image(s, image_url, profile_id)

  return RikishiRow(
    sumoAssociationId=profile_id,
    shikonaEn=shikona_en,
    shikonaJp=shikona_jp,
    heya=heya,
    birthDate=birth_date,
    heightCm=height_cm,
    weightKg=weight_kg,
    currentRank=rank,
    imagePath=image_path,
    profileUrl=profile_url,
    snapshotDate=snapshot_iso,
  )


def download_image(s: requests.Session, url: str, profile_id: str) -> Optional[str]:
  try:
    response = s.get(url, timeout=TIMEOUT_SEC)
    response.raise_for_status()
    sleep_throttle()
  except Exception:
    return None

  ext = ".jpg"
  if "image/png" in response.headers.get("Content-Type", ""):
    ext = ".png"

  IMAGE_DIR.mkdir(parents=True, exist_ok=True)
  file_name = f"{profile_id}{ext}"
  out_path = IMAGE_DIR / file_name
  out_path.write_bytes(response.content)

  return f"/images/rikishi/{file_name}"


def rank_with_side(banzuke_name: str, ew: Optional[int]) -> str:
  side = "East" if ew == 1 else "West" if ew == 2 else ""
  return f"{banzuke_name} {side}".strip()


def build_profile_url(rikishi_id: str) -> str:
  return f"{BASE_URL}/EnSumoDataRikishi/profile/{rikishi_id}/"


def try_download_banzuke_photo(
  s: requests.Session, photo_file: str, profile_id: str
) -> Optional[str]:
  if not photo_file:
    return None

  # Official site has changed static image paths over time; try a shortlist.
  candidates = [
    f"{BASE_URL}/img/sumo_data/rikishi/270x474/{photo_file}",
    f"{ALT_BASE_URL}/img/sumo_data/rikishi/270x474/{photo_file}",
    f"{BASE_URL}/img/sumo_data/rikishi/60x60/{photo_file}",
    f"{ALT_BASE_URL}/img/sumo_data/rikishi/60x60/{photo_file}",
    f"{BASE_URL}/img/sumo_data/rikishi/{photo_file}",
    f"{ALT_BASE_URL}/img/sumo_data/rikishi/{photo_file}",
    f"{BASE_URL}/images/sumo_data/rikishi/{photo_file}",
    f"{ALT_BASE_URL}/images/sumo_data/rikishi/{photo_file}",
    f"{BASE_URL}/img/rikishi/{photo_file}",
    f"{ALT_BASE_URL}/img/rikishi/{photo_file}",
    f"{BASE_URL}/images/rikishi/{photo_file}",
    f"{ALT_BASE_URL}/images/rikishi/{photo_file}",
  ]

  for url in candidates:
    try:
      response = s.get(
        url,
        timeout=TIMEOUT_SEC,
        headers={
          "Referer": Banzuke_URL,
          "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        },
      )
      content_type = response.headers.get("Content-Type", "")
      print(
        f"[photo] profile={profile_id} photo={photo_file} "
        f"request={url} status={response.status_code} final={response.url} "
        f"type={content_type} bytes={len(response.content)}"
      )
      if response.status_code != 200:
        continue
      if "image" not in content_type:
        continue
      # Very tiny payloads are likely placeholders/icons.
      if len(response.content) < 500:
        continue
      # Guard against server-side fallback banners returned via redirect.
      if photo_file and photo_file not in response.url:
        continue
      sleep_throttle()

      ext = ".jpg"
      if "png" in content_type:
        ext = ".png"

      IMAGE_DIR.mkdir(parents=True, exist_ok=True)
      file_name = f"{profile_id}{ext}"
      out_path = IMAGE_DIR / file_name
      out_path.write_bytes(response.content)
      return f"/images/rikishi/{file_name}"
    except Exception:
      continue

  return None


def build_row_from_banzuke(raw: dict, snapshot_iso: str, profile_url: str) -> RikishiRow:
  rid = str(raw.get("rikishi_id"))
  banzuke_name = str(raw.get("banzuke_name", "Maegashira")).strip()
  ew = raw.get("ew")
  return RikishiRow(
    sumoAssociationId=rid,
    shikonaEn=str(raw.get("shikona", f"Rikishi {rid}")),
    shikonaJp=None,
    heya=str(raw.get("heya_name", "")) or None,
    birthDate=None,
    heightCm=None,
    weightKg=None,
    currentRank=rank_with_side(banzuke_name, ew if isinstance(ew, int) else None),
    imagePath=None,
    profileUrl=profile_url,
    snapshotDate=snapshot_iso,
  )


def merge_enrichment(base: RikishiRow, parsed: RikishiRow) -> RikishiRow:
  invalid_names = {"Unknown", "URLに誤りがあります", "404", "Not Found"}
  parsed_name = parsed.shikonaEn.strip() if parsed.shikonaEn else ""
  use_name = parsed_name and parsed_name not in invalid_names
  return RikishiRow(
    sumoAssociationId=base.sumoAssociationId,
    shikonaEn=parsed_name if use_name else base.shikonaEn,
    shikonaJp=parsed.shikonaJp or base.shikonaJp,
    heya=parsed.heya or base.heya,
    birthDate=parsed.birthDate or base.birthDate,
    heightCm=parsed.heightCm or base.heightCm,
    weightKg=parsed.weightKg or base.weightKg,
    currentRank=parsed.currentRank if parsed.currentRank and parsed.currentRank != "Maegashira" else base.currentRank,
    imagePath=parsed.imagePath or base.imagePath,
    profileUrl=base.profileUrl,
    snapshotDate=base.snapshotDate,
  )


def main() -> None:
  RAW_DIR.mkdir(parents=True, exist_ok=True)
  IMAGE_DIR.mkdir(parents=True, exist_ok=True)

  s = session()
  fetched_at = datetime.now(timezone.utc)
  snapshot_iso = fetched_at.isoformat()

  links, banzuke_rows_by_id, ajax_payload, ajax_url = find_makuuchi_profile_links(s)
  stamp = fetched_at.strftime("%Y%m%d-%H%M%S")

  if ajax_payload:
    ajax_file = RAW_DIR / f"ajax-banzuke-{stamp}.json"
    ajax_file.write_text(ajax_payload, encoding="utf-8")
    print(f"Saved AJAX payload: {ajax_file}")
    if ajax_url:
      print(f"AJAX source URL: {ajax_url}")

  if not links:
    debug_file = RAW_DIR / "debug-last-discovery-failure.html"
    try:
      html = s.get(Banzuke_URL, timeout=TIMEOUT_SEC).text
      debug_file.write_text(html, encoding="utf-8")
    except Exception:
      pass
    raise RuntimeError(
      "No profile links found for makuuchi filter. "
      f"Saved a debug page snapshot to {debug_file} (if available)."
    )

  rows: List[RikishiRow] = []
  failures = []

  for idx, link in enumerate(links, start=1):
    try:
      rid = parse_profile_id(link)
      raw = banzuke_rows_by_id.get(rid)

      if raw:
        base_row = build_row_from_banzuke(raw, snapshot_iso, build_profile_url(rid))
        base_row.imagePath = try_download_banzuke_photo(s, str(raw.get("photo", "")), rid)
      else:
        base_row = RikishiRow(
          sumoAssociationId=rid,
          shikonaEn=f"Rikishi {rid}",
          shikonaJp=None,
          heya=None,
          birthDate=None,
          heightCm=None,
          weightKg=None,
          currentRank="Maegashira",
          imagePath=None,
          profileUrl=build_profile_url(rid),
          snapshotDate=snapshot_iso,
        )

      # Optional enrichment from profile page. Never allow it to degrade base quality.
      try:
        parsed = parse_profile(s, base_row.profileUrl, snapshot_iso, allow_image_download=False)
        final_row = merge_enrichment(base_row, parsed)
      except Exception:
        final_row = base_row

      rows.append(final_row)
      print(f"[{idx}/{len(links)}] parsed {final_row.shikonaEn}")
    except Exception as exc:
      fallback_row = None
      try:
        rid = parse_profile_id(link)
        raw = banzuke_rows_by_id.get(rid)
        if raw:
          fallback_row = build_row_from_banzuke(raw, snapshot_iso, build_profile_url(rid))
          fallback_row.imagePath = try_download_banzuke_photo(s, str(raw.get("photo", "")), rid)
      except Exception:
        fallback_row = None

      if fallback_row:
        rows.append(fallback_row)
        failures.append({"url": link, "error": f"profile-parse-failed; used-banzuke-fallback: {exc}"})
        print(f"[{idx}/{len(links)}] fallback {fallback_row.shikonaEn}")
      else:
        failures.append({"url": link, "error": str(exc)})
        print(f"[{idx}/{len(links)}] failed {link}: {exc}")

  payload = {
    "fetchedAt": snapshot_iso,
    "source": SEARCH_URL,
    "rikishi": [asdict(row) for row in rows],
    "failures": failures,
  }

  out_file = RAW_DIR / f"makuuchi-{stamp}.json"
  out_file.write_text(json.dumps(payload, indent=2), encoding="utf-8")

  print(f"Wrote snapshot: {out_file}")
  print(f"Parsed rows: {len(rows)} | Failures: {len(failures)}")


if __name__ == "__main__":
  main()
