
# 🥷 CodewarsSync — Chrome Extension

Automatically syncs your Codewars solutions to your GitHub repo the moment you complete a kata. Inspired by LeetSync.

---

## How It Works

```
You pass a kata on Codewars
        ↓
Extension detects you landed on /kata/:slug/solutions
        ↓
Grabs your solution code from the DOM
        ↓
Fetches kata metadata (name, rank, tags) from Codewars API
        ↓
Pushes to GitHub via GitHub API
        ↓
✅ Toast notification confirms sync
```

---

## Setup

### Step 1 — Generate a GitHub Token

1. Go to https://github.com/settings/tokens/new
2. Give it a name: `CodewarsSync`
3. Set expiration as you prefer
4. Under **Scopes**, check ✅ `repo`
5. Click **Generate token** and copy it

### Step 2 — Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle top-right)
3. Click **Load unpacked**
4. Select this `codewars-sync-extension` folder
5. The 🥷 icon appears in your toolbar

### Step 3 — Configure the Extension

1. Click the 🥷 icon in the toolbar
2. Fill in:
   - **GitHub Token**: the token you generated
   - **GitHub Username**: your GitHub username
   - **Repository Name**: `codewars-code-sync`
3. Click **Save Settings**
4. Status bar turns green: `Connected → username/codewars-code-sync`

---

## Usage

Just solve katas normally on Codewars. After you pass all tests and land on the solutions page, the extension automatically syncs your solution. You'll see a toast at the bottom-right:

```
✅ Synced! Two Sum → javascript/6-kyu/two-sum/solution.js
```

---

## Repo Structure

Solutions are organized by language → rank → kata slug:

```
codewars-code-sync/
  javascript/
    8-kyu/
      multiply/
        solution.js
    6-kyu/
      two-sum/
        solution.js
  typescript/
    5-kyu/
      some-kata/
        solution.ts
```

Each solution file has a header:

```js
// Kata   : Two Sum
// Rank   : 6 kyu
// Lang   : javascript
// Tags   : Algorithms, Arrays
// URL    : https://www.codewars.com/kata/52aa9c2e3a42a77be000001
// Synced : 22/05/2026

function twoSum(nums, target) {
  // your solution...
}
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Toast says "not configured" | Open popup and save your settings |
| "Repo not found" error | Check username and repo name are correct |
| "Invalid token" error | Regenerate your GitHub token with `repo` scope |
| No toast appears | Refresh the Codewars page and re-submit |
| Wrong code synced | The DOM selector may have changed — open an issue |
