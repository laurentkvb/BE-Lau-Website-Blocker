# BE-Lau-Website-Blocker

`BE-Lau-Website-Blocker` is a local Brave extension repository for a website blocker that helps you stay focused with a clean dashboard, temporary unblocks, and motivational philosophical quotes.

## About

This extension is built as a Chrome/Brave Manifest V3 extension. It blocks configured domains and redirects blocked navigation to a custom block page that displays a thoughtful quote.

The root folder name represents the Brave extension package.

## Key Features

- Block specified domains and all subdomains (e.g. `example.com`, `sub.example.com`)
- Save blocked sites using `chrome.storage.local`
- Temporary unblocks for 5, 10, or 30 minutes
- Re-block any temporarily unblocked site immediately
- "Unblock All for 5 Minutes" button for quick breaks
- "Re-block All Now" button shown only when active temporary unblocks exist
- Custom blocked page with the attempted URL and a random philosophical quote
- Minimal, clean UI with accessible styling
- Background alarm cleanup to expire unblock timers automatically

## Repository Contents

- `manifest.json` — Manifest V3 extension configuration
- `background.js` — Service worker that manages blocking rules, storage, and alarms
- `options.html` — Dashboard UI for managing blocked sites and temporary access
- `options.js` — Dashboard logic for site add/remove and unblock timer actions
- `blocked.html` — Block page shown when navigation is blocked
- `blocked.js` — Block page logic to display the blocked URL and quote
- `quotes.js` — Array of inspirational quotes from philosophers, Stoics, Buddhists, and motivational figures
- `styles.css` — Shared styling for the options and blocked pages
- `icons/` — SVG icon assets used by the extension

## How to Load Locally in Brave

1. Open Brave and go to `brave://extensions`.
2. Enable `Developer mode` in the top-right corner.
3. Click `Load unpacked`.
4. Select the `BE-Lau-Website-Blocker` folder from this repository.
5. The extension should now appear in your Brave extension list.

## How to Use

1. Open the extension options page by clicking `Details` on the extension card and then `Extension options`, or by opening `options.html` directly using the extension details page.
2. Add a domain like `facebook.com` to the blocked sites list.
3. Visit the blocked domain in Brave. You should be redirected to the custom block page.
4. Use the unblock buttons to allow temporary access for 5, 10, or 30 minutes.
5. Use `Re-block now` for an individual site or `Re-block All Now` if all sites currently have active temporary unblocks.

## Development Notes

- The extension uses `chrome.declarativeNetRequest` to manage blocking rules.
- Temporary unblock timers are stored in `chrome.storage.local` and cleaned up with `chrome.alarms`.
- `blocked.html` uses `document.referrer` to show the attempted URL after redirection.
- `options.js` refreshes the blocking rules when the blocked site list or temporary unblocks change.

## Notes

- Because this is a local unpacked extension, no `npm install` or build step is required unless you add additional tooling later.
- If you add new files, refresh the extension in `brave://extensions` to load the latest changes.

## License

This repository contains code created for a local Brave extension project. Feel free to use and modify it for personal focus and productivity workflows.
