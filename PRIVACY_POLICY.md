# Privacy Policy – Search Optimizer

_Last updated: April 2026_

## Overview

Search Optimizer is a browser extension that helps clean up Google Search results by hiding unwanted modules and specific websites from appearing in your search results.

## Data Collection

**Search Optimizer collects no personal data.**

- We do **not** collect, transmit, or store any personally identifiable information.
- We do **not** track your browsing history, search queries, or search results.
- We do **not** communicate with any external servers. The extension operates entirely locally in your browser.

## Data Storage

The only data stored by the extension is your personal settings (which Google modules to hide, which domains to filter, whether Infinite Scroll is enabled). This data is stored exclusively in your browser's local storage (`chrome.storage.local`) and **never leaves your device**.

## Permissions

- **`storage`**: Used to save your filter preferences locally on your device.
- **`tabs`**: Used solely to send a live-update signal to open Google tabs when you change a setting in the popup, so changes take effect immediately without a page reload.
- **Host permissions for Google domains**: Required to inject the content script that performs the filtering on Google Search pages.

## Contact

If you have any questions about this privacy policy, please open an issue on the [GitHub repository](https://github.com/exUs541/Search-Optimizer).
