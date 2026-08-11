import { test, expect } from "@playwright/test";
import {
  chunkSheets,
  backOrder,
  needsRotate180,
} from "../src/utils/qr-sheet-layout";

test("chunkSheets chia 4/tờ và đệm null tờ cuối", () => {
  expect(chunkSheets([1, 2, 3, 4, 5])).toEqual([
    [1, 2, 3, 4],
    [5, null, null, null],
  ]);
});

test("chunkSheets rỗng trả []", () => {
  expect(chunkSheets([])).toEqual([]);
});

test("chunkSheets vừa đủ 4 không thừa ô", () => {
  expect(chunkSheets([1, 2, 3, 4])).toEqual([[1, 2, 3, 4]]);
});

test("backOrder long = đảo cột [1,0,3,2]", () => {
  expect(backOrder("long")).toEqual([1, 0, 3, 2]);
});

test("backOrder short = đảo hàng [2,3,0,1]", () => {
  expect(backOrder("short")).toEqual([2, 3, 0, 1]);
});

test("needsRotate180 chỉ true khi short", () => {
  expect(needsRotate180("long")).toBe(false);
  expect(needsRotate180("short")).toBe(true);
});
