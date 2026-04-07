const test = require("node:test");
const assert = require("node:assert/strict");

const {
  DEFAULT_SNAPSHOT_MIN_AGE_MS,
  calculateDiffValues,
  formatPercent,
  formatPercentagePoints,
  formatSnapshotTimestamp,
  formatSnapshotIntervalLabel,
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
    percentagePerformance: 5,
    sinceBuyValue: 10
  };

  assert.equal(hasSnapshotValuesChanged(entry, entry), false);
});

test("calculateDiffValues uses forward direction", () => {
  const diff = calculateDiffValues(
    {
      currentValue: 100,
      absolutePerformance: 10,
      percentagePerformance: 5,
      sinceBuyValue: 10
    },
    {
      currentValue: 110,
      absolutePerformance: 20,
      percentagePerformance: 8,
      sinceBuyValue: 20
    }
  );

  assert.deepEqual(diff, {
    currentValueDiff: 10,
    absolutePerformanceDiff: 10,
    percentageDiff: 3,
    sinceBuyDiff: 10
  });
});

test("format helpers use German display conventions", () => {
  assert.equal(formatPercent(1.5), "1,50 %");
  assert.equal(formatPercentagePoints(1.5), "1,50 %-Pkt.");
  assert.equal(formatSnapshotIntervalLabel(DEFAULT_SNAPSHOT_MIN_AGE_MS), "2 Stunden");
});

test("formatSnapshotTimestamp returns a readable timestamp", () => {
  assert.equal(formatSnapshotTimestamp("2026-04-07T12:34:56.000Z").includes("2026"), true);
});
