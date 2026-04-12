# Finanzen.net Last Visit Diff

Chrome extension for `finanzen.net` that adds portfolio diffs since the last snapshot or visit.

## What it does

On `finanzen.net/depot/*` pages the extension adds:

- a summary block for portfolio changes since the last snapshot
- an extra table column with per-position changes
- client-side sorting for:
  - `± zuletzt`
  - `% zuletzt`
  - `∑ zuletzt`
- snapshot controls in the popup

## How it works

The extension stores lightweight portfolio snapshots in the browser and compares the current depot view against the last stored state.

Current behavior:

- snapshots are stored locally in the browser
- snapshots are refreshed only after the configured interval
- unchanged values do not overwrite the previous snapshot
- depot positions are matched primarily via `pkdepdatennr`

## Permissions

The extension currently uses:

- `storage`
- `tabs`

## Development

Load the extension in Chrome as an unpacked extension from the project root:

`/Users/stefanebonnek/Projekte/dev/ChromePlugin/finanzenDotNetDiff/FinanzenDotNetDiff`

Run tests with:

```bash
npm test
```

## Project docs

Additional project notes live in [`docs/`](/Users/stefanebonnek/Projekte/dev/ChromePlugin/finanzenDotNetDiff/FinanzenDotNetDiff/docs):

- [roadmap.md](/Users/stefanebonnek/Projekte/dev/ChromePlugin/finanzenDotNetDiff/FinanzenDotNetDiff/docs/roadmap.md)
- [decisions.md](/Users/stefanebonnek/Projekte/dev/ChromePlugin/finanzenDotNetDiff/FinanzenDotNetDiff/docs/decisions.md)
- [local-storage-schema.md](/Users/stefanebonnek/Projekte/dev/ChromePlugin/finanzenDotNetDiff/FinanzenDotNetDiff/docs/local-storage-schema.md)
- [todo.md](/Users/stefanebonnek/Projekte/dev/ChromePlugin/finanzenDotNetDiff/FinanzenDotNetDiff/docs/todo.md)

## Disclaimer

This project is an independent extension and is not affiliated with or endorsed by `finanzen.net`.
