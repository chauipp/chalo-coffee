import assert from "node:assert/strict";
import test from "node:test";
import { canonicalModifierKey, modifierPrice } from "./cart-modifiers.ts";

test("modifier key ignores selection order", () => assert.equal(canonicalModifierKey(["b", "a"]), canonicalModifierKey(["a", "b"])));
test("modifier price sums selected option adjustments", () => assert.equal(modifierPrice([{ id: "g", name: "Size", selectionType: "SINGLE", isRequired: true, sortOrder: 0, options: [{ id: "m", name: "Lớn", priceAdjustment: 5000, sortOrder: 0 }] }], ["m"]), 5000));
