const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");

test("BlindSpot API route exists", () => {
  assert.equal(fs.existsSync("app/api/analyze/route.ts"), true);
});

test("BlindSpot audit schema contains core reasoning sections", () => {
  const source = fs.readFileSync("lib/ai-auditor.ts", "utf8");

  for (const section of [
    "assumptions",
    "missingInformation",
    "reasoningConflicts",
    "secondOrderEffects",
    "timeHorizon",
    "perspectiveShifts",
    "evidenceVsBelief",
    "questions"
  ]) {
    assert.match(source, new RegExp(section));
  }
});

test("Decision form has all required reasoning inputs", () => {
  const source = fs.readFileSync("components/DecisionForm.tsx", "utf8");

  for (const field of ["decision", "context", "reasoning", "priorities"]) {
    assert.match(source, new RegExp(`id="${field}"`));
  }
});
