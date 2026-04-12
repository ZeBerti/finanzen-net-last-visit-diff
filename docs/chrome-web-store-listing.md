# Chrome Web Store Listing Draft

## Name

Finanzen.net Depot Diff

## Short Description

Shows portfolio changes on finanzen.net since your last snapshot or visit.

## Detailed Description

Finanzen.net Depot Diff adds a lightweight change view to finanzen.net depot pages.

The extension compares the current depot page with an earlier local snapshot and shows:

- portfolio changes since the last snapshot
- per-position changes in an additional table column
- change sorting for:
  - `± zuletzt`
  - `% zuletzt`
  - `∑ zuletzt`
- snapshot controls in the popup

Key characteristics:

- runs directly on finanzen.net depot pages
- stores snapshots locally in the browser
- does not send depot data to an external server
- uses stable position matching where available

This extension is intended for users who want to quickly see what changed in their depot view since the last meaningful snapshot instead of comparing values manually.

## Category

Productivity

Alternative:

- Finance

## Suggested Screenshots

### Screenshot 1

- Depot page with the summary block `Perf. seit ...`
- goal: show the main product value immediately

### Screenshot 2

- table with the plugin column visible
- goal: show `± zuletzt`, `% zuletzt`, `∑ zuletzt`

### Screenshot 3

- sorted table view
- goal: show client-side sorting by the plugin values

### Screenshot 4

- popup with snapshot interval and controls
- goal: show configuration and manual refresh/reset

## Notes for the Store Form

- Privacy Policy:
  - public URL:
    - https://zeberti.github.io/finanzen-net-last-visit-diff/privacy-policy.html
- Support / Homepage:
  - GitHub repo:
    - https://github.com/ZeBerti/finanzen-net-last-visit-diff
- Single purpose:
  - compare current finanzen.net depot values with earlier local snapshots
