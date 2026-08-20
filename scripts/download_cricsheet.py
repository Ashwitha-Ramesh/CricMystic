#!/usr/bin/env python3
"""
CricMystic - Cricsheet IPL Downloader & Extractor
Downloads the official Cricsheet IPL JSON archive and extracts raw match records.
"""

import os
import sys
import json
import zipfile
import hashlib
import urllib.request
from datetime import datetime

CRICSHEET_IPL_URL = "https://cricsheet.org/downloads/ipl_json.zip"

def download_and_extract(
    url: str = CRICSHEET_IPL_URL,
    dest_zip: str = "data/raw/ipl_json.zip",
    extract_to: str = "data/raw/cricsheet"
):
    print(f"[*] Starting Cricsheet IPL download from: {url}")
    os.makedirs(os.path.dirname(dest_zip), exist_ok=True)
    os.makedirs(extract_to, exist_ok=True)

    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (CricMystic-IPL-Data-Pipeline/2.0)"}
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            if response.status != 200:
                raise RuntimeError(f"HTTP Error {response.status} fetching Cricsheet archive")
            data = response.read()
    except Exception as e:
        print(f"[!] Network error downloading from {url}: {e}")
        # If we already have zip locally from earlier check, fallback
        if os.path.exists("data_temp_ipl.zip"):
            print("[*] Using cached downloaded zip: data_temp_ipl.zip")
            with open("data_temp_ipl.zip", "rb") as f:
                data = f.read()
        elif os.path.exists(dest_zip):
            print(f"[*] Using existing zip at {dest_zip}")
            with open(dest_zip, "rb") as f:
                data = f.read()
        else:
            raise

    # Compute SHA256 checksum
    checksum = hashlib.sha256(data).hexdigest()
    file_size_mb = len(data) / (1024 * 1024)
    print(f"[+] Download complete: {len(data):,} bytes ({file_size_mb:.2f} MB)")
    print(f"[+] SHA256 Checksum: {checksum}")

    # Save zip
    with open(dest_zip, "wb") as f:
        f.write(data)

    # Extract JSON files
    print(f"[*] Extracting match JSON files to: {extract_to}")
    extracted_files = []
    with zipfile.ZipFile(dest_zip, "r") as z:
        for member in z.namelist():
            if member.endswith(".json") and not member.startswith("README"):
                z.extract(member, path=extract_to)
                extracted_files.append(member)

    print(f"[+] Successfully extracted {len(extracted_files):,} match files.")

    metadata = {
        "source": "Cricsheet",
        "source_url": url,
        "download_timestamp": datetime.utcnow().isoformat() + "Z",
        "sha256_checksum": checksum,
        "file_size_bytes": len(data),
        "total_extracted_json_files": len(extracted_files)
    }

    return metadata

if __name__ == "__main__":
    download_and_extract()
