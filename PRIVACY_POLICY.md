# Privacy Policy – Search Filter & Site Blocker (Search Optimizer)

_Last updated: November 2026_

## Overview

Search Filter & Site Blocker (called "Search Optimizer" inside the extension) is a browser extension that cleans up Google Search
results pages: it hides sites you blocked, hides modules such as AI Overviews and ads, and adds infinite scroll and search
operator shortcuts.

## Data collection

**The extension collects no personal data.**

- It does **not** collect, transmit or sell any personal information.
- It does **not** track your browsing history, search queries or search results.
- It does **not** use analytics, advertising or any server of its own. It runs entirely in your browser.

## What is stored

The extension stores only your settings: the sites and words you blocked or highlighted, which modules and search tabs you
hide, the colors you picked and the on/off state of the options. This data is kept in your browser's extension storage on your
device and is never sent anywhere. You can export it to a JSON file and import it again from the popup. Removing the extension
deletes it.

## Network requests

- **Infinite scroll:** when it is switched on, the extension loads the next page of Google results from Google, exactly like
  clicking "Next". No other server is involved.
- **Hide AI Overviews:** when it is switched on, the extension adds `-noai` to your Google query and hides the suffix in the search
  box. The query still goes only to Google.
- **Image tools:** the Download button asks the browser to download the image from its original address.
- **Fun tab:** the buttons open a Google search or, for two of them (Gravity, Underwater), a third-party page in a new tab, only when
  you click them.

## Permissions

- **`storage`**: saves your settings on your device.
- **`tabs`**: finds your open Google Search tabs to apply a changed setting right away, opens tabs from the Fun tab and reloads
  the current results page for the AI Overview option.
- **`webNavigation`**: applies the AI Overview option before a results page loads.
- **`downloads`**: saves an image when you click Download in expanded image results.
- **Host access to Google Search domains** (google.com, google.de, google.at, google.ch, google.co.uk, google.fr, google.es,
  google.it, google.nl, google.be): the filters, buttons and panels run on results pages of these domains.

## Trademarks

Google is a trademark of Google LLC. This extension is an independent project and is not affiliated with, endorsed by or
sponsored by Google.

## Contact

If you have any questions about this privacy policy, please open an issue on the
[GitHub repository](https://github.com/exUs541/Search-Optimizer).
