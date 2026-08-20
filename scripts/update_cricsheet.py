#!/usr/bin/env python3
"""
CricMystic - Automated Cricsheet Dataset Refresh
Refreshes raw Cricsheet data archive, reparses matches, updates historical statistics,
retrains and recalibrates the ML model, and updates data manifest & metadata.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from download_cricsheet import download_and_extract
from generate_artifacts import generate_all_artifacts

def main():
    print("=" * 70)
    print("CRICMYSTIC - AUTOMATED CRICSHEET DATASET REFRESH")
    print("=" * 70)

    # 1. Download newest archive
    download_and_extract()

    # 2. Parse, retrain, export
    generate_all_artifacts()

    print("\n[+] CricMystic dataset and ML pipeline successfully refreshed!")

if __name__ == "__main__":
    main()
