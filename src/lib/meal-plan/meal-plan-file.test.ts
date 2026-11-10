import { describe, expect, it } from "vitest";

import { mealPlanFileName, parseMealPlanFile, serializeMealPlan } from "./meal-plan-file";

const plan = {
  recipes: [
    { id: "a".repeat(24), name: "Linsensuppe", imageId: "recipes/abc", cookingTimeMinutes: 20 },
    { id: "b".repeat(24), name: "Ofengemüse", imageId: null, cookingTimeMinutes: null },
  ],
  days: 5,
  people: 3,
};

describe("serializeMealPlan", () => {
  it("writes a versioned file that reads back as the same plan", () => {
    const text = serializeMealPlan(plan, new Date("2026-11-08T10:00:00Z"));

    expect(JSON.parse(text)).toMatchObject({
      type: "picnic-meal-plan",
      version: 1,
      exportedAt: "2026-11-08T10:00:00.000Z",
    });
    expect(parseMealPlanFile(text)).toEqual(plan);
  });
});

describe("mealPlanFileName", () => {
  it("names the file after the local date", () => {
    expect(mealPlanFileName(new Date(2026, 10, 8, 23, 30))).toBe(
      "picnic-meal-plan-2026-11-08.json"
    );
  });
});

describe("parseMealPlanFile", () => {
  it("reads the raw value of picnic_meal_plan_confirmed", () => {
    expect(parseMealPlanFile(JSON.stringify(plan))).toEqual(plan);
  });

  it.each([
    ["text that isn't JSON", "not json"],
    ["another JSON file", JSON.stringify({ hello: "world" })],
    ["a newer version", JSON.stringify({ type: "picnic-meal-plan", version: 2, plan })],
    ["a plan without recipes", JSON.stringify({ ...plan, recipes: [] })],
    ["a recipe without an id", JSON.stringify({ ...plan, recipes: [{ name: "Suppe" }] })],
    ["a recipe without a name", JSON.stringify({ ...plan, recipes: [{ id: "c".repeat(24) }] })],
    ["days that aren't a number", JSON.stringify({ ...plan, days: "5" })],
  ])("rejects %s", (_case, text) => {
    expect(parseMealPlanFile(text)).toBeNull();
  });

  it("keeps days and people within what the page allows", () => {
    expect(parseMealPlanFile(JSON.stringify({ ...plan, days: 99, people: 0 }))).toMatchObject({
      days: 30,
      people: 1,
    });
  });

  it("lists a recipe once and fills in missing optional fields", () => {
    const parsed = parseMealPlanFile(
      JSON.stringify({
        ...plan,
        recipes: [
          { id: "c".repeat(24), name: "Curry" },
          { id: "c".repeat(24), name: "Curry" },
        ],
      })
    );

    expect(parsed?.recipes).toEqual([
      { id: "c".repeat(24), name: "Curry", imageId: null, cookingTimeMinutes: null },
    ]);
  });
});
