#!/usr/bin/env python3
"""Validate the official price cards (A-G) from the first sheet (价卡).

Rules:
- Read only the first sheet (named 价卡) and only columns A-G.
- Read all 19 rows, but skip header/blank/remark rows when extracting cards.
- Handle merged cells: inherit values from the merged range's top-left cell.

Usage:
  python scripts/validate-official-xlsx.py "../东南亚跨境物流运费价格表20261030(1).xlsx"
"""

from __future__ import annotations

import json
import sys
from dataclasses import dataclass

import openpyxl


@dataclass(frozen=True)
class OfficialRow:
  sourceRow: int
  country: str
  region: str
  channel: str
  currency: str
  startingWeightG: int
  startingPrice: float
  incrementPricePer10G: float


def build_merged_value_map(ws):
  merged = {}
  for rng in ws.merged_cells.ranges:
    min_row, min_col, max_row, max_col = rng.min_row, rng.min_col, rng.max_row, rng.max_col
    v = ws.cell(min_row, min_col).value
    for r in range(min_row, max_row + 1):
      for c in range(min_col, max_col + 1):
        merged[(r, c)] = v
  return merged


def cell_value(ws, merged, r: int, c: int):
  v = ws.cell(r, c).value
  if v is None and (r, c) in merged:
    return merged[(r, c)]
  return v


def main():
  if len(sys.argv) != 2:
    print("Usage: python scripts/validate-official-xlsx.py <xlsx_path>", file=sys.stderr)
    raise SystemExit(2)

  path = sys.argv[1]
  wb = openpyxl.load_workbook(path, data_only=True)
  ws = wb.worksheets[0]
  if ws.title != "价卡":
    raise SystemExit(f"Unexpected first sheet title: {ws.title}")

  merged = build_merged_value_map(ws)

  # Read raw A-G (1..7) for rows 1..19.
  raw = []
  for r in range(1, 20):
    raw.append([cell_value(ws, merged, r, c) for c in range(1, 8)])

  # Extract cards: data rows are 3..14 (inclusive) in the provided file.
  cards: list[OfficialRow] = []
  for r in range(3, 15):
    row = raw[r - 1]
    if not row[0] or row[0] == "备注":
      continue

    country, region, channel, currency, sw, sp, inc = row[:7]
    cards.append(
      OfficialRow(
        sourceRow=r,
        country=str(country),
        region=str(region),
        channel=str(channel),
        currency=str(currency),
        startingWeightG=int(sw),
        startingPrice=float(sp),
        incrementPricePer10G=float(inc),
      )
    )

  print(json.dumps({
    "sheet": ws.title,
    "maxRow": ws.max_row,
    "maxCol": ws.max_column,
    "rawAtoG": raw,
    "cards": [c.__dict__ for c in cards],
  }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
  main()
