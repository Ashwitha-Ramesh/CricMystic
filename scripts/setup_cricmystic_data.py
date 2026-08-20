#!/usr/bin/env python3
"""
CricMystic - Master Backend Data Initialization
Performs complete first-time setup:
1. Downloads official Cricsheet IPL JSON archive
2. Validates & extracts match JSON files
3. Normalizes teams & players
4. Computes cricket-correct legal overs and chase metrics
5. Trains and calibrates ML win probability model (chronological 2008-2023 train, 2024 val, 2025-2026 test)
6. Computes match turning points with ML model
7. Exports processed datasets, data/metadata.json, data/manifest.json, and data_quality_report.json
"""

import sys
import os

# Ensure scripts dir is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from download_cricsheet import download_and_extract
from generate_artifacts import generate_all_artifacts

def main():
    print("=" * 70)
    print("CRICMYSTIC - AUTHORITATIVE IPL DATA PIPELINE SETUP")
    print("=" * 70)

    # Step 1: Download & extract Cricsheet
    download_metadata = download_and_extract()
    print(f"\n[✓] Download & Extraction Complete: {download_metadata['total_extracted_json_files']} matches.")

    # Step 2: Parse, Train ML, and Generate Artifacts
    generate_all_artifacts()

    print("\n" + "=" * 70)
    print("CRICMYSTIC SETUP COMPLETED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    main()
