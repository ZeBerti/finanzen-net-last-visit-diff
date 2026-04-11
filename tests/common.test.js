const test = require("node:test");
const assert = require("node:assert/strict");

const {
  DEFAULT_SNAPSHOT_MIN_AGE_MS,
  calculateDiffValues,
  formatPercent,
  formatSnapshotTimestamp,
  formatSnapshotIntervalLabel,
  getDeterministicTestPriceDirection,
  hasSnapshotValuesChanged,
  shouldRefreshSnapshot
} = require("../scripts/common.js");

test("shouldRefreshSnapshot returns false for fresh snapshots", () => {
  const entry = {
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  };

  assert.equal(shouldRefreshSnapshot(entry, DEFAULT_SNAPSHOT_MIN_AGE_MS), false);
});

test("shouldRefreshSnapshot returns true for old snapshots", () => {
  const entry = {
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  };

  assert.equal(shouldRefreshSnapshot(entry, DEFAULT_SNAPSHOT_MIN_AGE_MS), true);
});

test("hasSnapshotValuesChanged detects identical values", () => {
  const entry = {
    currentValue: 100,
    absolutePerformance: 10,
    sinceBuyValue: 10
  };

  assert.equal(hasSnapshotValuesChanged(entry, entry), false);
});

test("hasSnapshotValuesChanged detects changed values", () => {
  const previousEntry = {
    currentValue: 100,
    absolutePerformance: 10,
    sinceBuyValue: 10
  };

  const currentValues = {
    currentValue: 100,
    absolutePerformance: 15,
    sinceBuyValue: 10
  };

  assert.equal(hasSnapshotValuesChanged(previousEntry, currentValues), true);
});

test("calculateDiffValues uses forward direction and relative percentage change", () => {
  const diff = calculateDiffValues(
    {
      currentValue: 100,
      absolutePerformance: 10,
      sinceBuyValue: 10
    },
    {
      currentValue: 110,
      absolutePerformance: 20,
      sinceBuyValue: 20
    }
  );

  assert.deepEqual(diff, {
    currentValueDiff: 10,
    absolutePerformanceDiff: 10,
    percentageDiff: 10,
    sinceBuyDiff: 10
  });
});

test("calculateDiffValues returns zero percentage diff when snapshot price is zero", () => {
  const diff = calculateDiffValues(
    {
      currentValue: 0,
      absolutePerformance: 0,
      sinceBuyValue: 0
    },
    {
      currentValue: 10,
      absolutePerformance: 10,
      sinceBuyValue: 10
    }
  );

  assert.equal(diff.percentageDiff, 0);
});

test("format helpers use German display conventions", () => {
  assert.equal(formatPercent(1.5), "1,50 %");
  assert.equal(formatSnapshotIntervalLabel(DEFAULT_SNAPSHOT_MIN_AGE_MS), "2 Stunden");
});

test("formatSnapshotTimestamp returns a readable timestamp", () => {
  assert.equal(formatSnapshotTimestamp("2026-04-07T12:34:56.000Z").includes("2026"), true);
});

test("formatSnapshotTimestamp handles missing or invalid timestamps", () => {
  assert.equal(formatSnapshotTimestamp(null), "kein Snapshot");
  assert.equal(formatSnapshotTimestamp("kaputt"), "ungueltig");
});

test("getDeterministicTestPriceDirection is stable for the same input", () => {
  const firstValue = getDeterministicTestPriceDirection("depot-entry:33337146");
  const secondValue = getDeterministicTestPriceDirection("depot-entry:33337146");

  assert.equal(firstValue, secondValue);
  assert.equal(Math.abs(firstValue), 1);
});
