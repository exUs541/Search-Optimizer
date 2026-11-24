# Search Filter & Site Blocker (Search Optimizer) – store listing

Copy-paste texts and field values for the **Chrome Web Store** and **Microsoft Edge Add-ons**. One text serves both stores; a heading says so when something applies to one store only. Images and file names: see [README.md](README.md).

## Name and short description

Both come from the package (`manifest.json`), do not enter them by hand. The name is unchanged, the short description is new.

**Name** (51 characters, Chrome allows 75)

```
Search Filter & Site Blocker - Clean Search Results
```

**Short description** (125 characters, max. 132)

```
Block sites and hide AI Overviews, ads and clutter in Google Search. Infinite scroll and one-click search operators included.
```

Why it reads this way:

- The name already contains the terms people search for ("search filter", "site blocker", "search results") and no Google mark, so it was left alone. Renaming it "Search Optimizer" would match SEO tools in the store.
- The short description adds the verbs and the heavily searched "AI Overviews". "Google Search" appears only to say where the extension works, not as part of the name.
- The brand "Search Optimizer" stays in the logo, the images, the popup and the first sentence of the description.
- No keyword repeats conspicuously (Google's rule of thumb: at most about five repetitions).

## Description (both stores)

Plain text without HTML, about 3,400 characters (limits: Chrome 16,000, Edge 10,000).

```
Take back your Google Search. Search Filter & Site Blocker (called "Search Optimizer" inside the extension) hides the sites you never want to see, removes AI Overviews, ads and other clutter, and adds infinite scroll and one-click search operators, all from one clean popup.

It works on Google Search results pages: google.com, google.de, google.at, google.ch, google.co.uk, google.fr, google.es, google.it, google.nl and google.be.

WHAT YOU CAN DO

• Block sites: click the block button next to any result, or add a domain in the popup. Results from that site disappear from every search.
• Block keywords: add words or phrases, and every result that contains one of them disappears. Matching is by whole word and ignores upper and lower case, so "ai" hides "AI tools" but not "said".
• Highlight sites you trust: click the star next to a result, or add domains and keywords. Matching results get a colored frame, so you spot them faster.
• Hide AI Overviews: switch off the AI box on the results page. For this option the extension adds "-noai" to your query and hides that suffix in the search box.
• Hide clutter: sponsored results, People also ask, People also search for, the knowledge panel, discussions and forums, locations, products, videos and image blocks. One eye icon each.
• Tidy the navigation: hide search tabs you never use, such as More, Tools, Books, Finance, Flights, Maps, News, Shopping or Videos.
• Infinite scroll: the next page of results loads while you scroll, so you never click "Next". A switch turns it off at any time.
• Scroll buttons: floating buttons jump to the top or the bottom of the page.
• Search operators: a gear next to the search bar opens a panel with ready-made operators such as site:, filetype:, intitle:, inurl:, exact match, exclude, OR, before: and after:, plus quick filters for the past hour, day, week and year.
• Image tools: in expanded Google Images results, open the image, download it or copy its link.
• Your colors: pick a theme preset or your own colors for the highlight and the scroll buttons. The popup follows your light or dark system theme.
• Backup: export all settings to a JSON file and import them on another computer.
• Just for fun: a tab with Google classics such as Barrel Roll, Pacman and Snake.

HOW TO START

1. Install the extension and run a Google search.
2. Click the toolbar icon. In "General", switch on Infinite Scroll. Under "Google UI", hide what you do not need.
3. Click the red circle button next to a result, or add a domain or a keyword under "Filters".
4. Click the gear next to the search bar to open the search operators.

PRIVATE BY DESIGN

• No account, no ads, no analytics and no server of our own.
• Your lists and settings are stored in your browser and never leave your device.
• Infinite scroll loads the next results page straight from Google, exactly like clicking "Next".

PERMISSIONS

• Access to the Google Search domains listed above: the filters, buttons and panels run on results pages.
• storage: saves your lists and settings.
• tabs: refreshes your open Google Search tabs when you change a setting.
• webNavigation: applies the AI Overview option before a results page loads.
• downloads: saves an image when you click Download in image results.

Google is a trademark of Google LLC. This extension is an independent project and is not affiliated with, endorsed by or sponsored by Google.
```

## Fields

| Field | Chrome | Edge |
|---|---|---|
| Category | Productivity (alternative: Tools) | Search tools |
| Language | English | English |
| Website | `https://github.com/exUs541/Search-Optimizer` | same |
| Privacy policy URL | `https://github.com/exUs541/Search-Optimizer/blob/main/PRIVACY_POLICY.md` | same |
| Mature content / remote code | No / No | No / No |

## Chrome Web Store only: Privacy practices

Chrome has no search-term fields; name, short description and description count, and the seven terms below are woven into them. Paste into the Developer Dashboard, tab "Privacy practices".

**Single purpose**

```
Clean up and customize Google Search results pages: block sites, hide AI Overviews, ads and other modules, and add infinite scroll and search operator shortcuts.
```

**storage justification**

```
Saves the user's blocked and highlighted sites, hidden modules and tabs, colors and option switches on the user's device.
```

**tabs justification**

```
Finds the user's open Google Search tabs to apply a changed setting right away, opens tabs from the Fun tab, and reloads the current results page when the AI Overview option needs a query change.
```

**webNavigation justification**

```
Applies the "hide AI Overviews" option before a Google results page loads, by adding "-noai" to the search query of that navigation.
```

**downloads justification**

```
Saves an image to disk when the user clicks the Download button in expanded Google Images results.
```

**Host permission justification (Google Search domains)**

```
The content scripts run only on Google Search results pages (google.com, .de, .at, .ch, .co.uk, .fr, .es, .it, .nl, .be). They hide blocked sites and page modules, add the block and star buttons, the scroll buttons and the search operator panel, and load the next results page for infinite scroll. Nothing is sent to any server other than Google.
```

**Remote code:** No. **Data usage:** the extension does not collect or transmit user data. Tick none of the data types and confirm the three certifications (no sale of data, no use unrelated to the single purpose, no creditworthiness use).

## Microsoft Edge only

**Search terms** (max. 7 terms, 2 to 3 words each, under 21 words together; one term per field in Partner Center)

```
block search results
google site blocker
hide ai overview
google infinite scroll
hide sponsored results
search results filter
search operators
```

They cover the searches that match the features: blocking sites, hiding AI Overviews, hiding ads, infinite scroll, filtering, operators. Each term is worded differently so that none repeats another. No third-party product names are used as terms (Edge checks that terms fit the extension, and foreign brands count as misleading).

**Notes for certification**

```
No account or login is needed. The extension runs only on Google Search results pages and stores its settings with the extension storage API; no data is sent to any server other than Google.

How to test: open https://www.google.com/search?q=pizza, click the extension icon, open the "Filters" tab, expand "Block Domains", add a domain from the results (for example the first result's domain) and reload the page - results from that domain disappear. A block button (circle with a slash) and a star also appear next to every result. Under "Block Keywords" add a word from a result's title (for example "guide") - results containing that whole word disappear. In the "General" tab switch on "Infinite Scroll" and scroll down to load further result pages; the gear next to the search bar opens the search operators panel.

Hide AI Overviews (Google UI tab, "Hide Modules"): when switched on, the extension adds "-noai" to the Google query and removes that suffix from the search box and the page title again. The query goes only to Google.

The "Fun" tab opens a Google search (for example "do a barrel roll") in a new tab on click. Two buttons (Gravity, Underwater) open third-party pages in a new tab on click.

Single purpose: clean up and customize Google Search results pages (block sites, hide AI Overviews, ads and other modules, infinite scroll, search operator shortcuts).

Permissions
- storage: save the user's lists and settings.
- tabs: find open Google Search tabs to apply a changed setting, open tabs from the Fun tab.
- webNavigation: apply the AI Overview option before a results page loads.
- downloads: save an image when the user clicks Download in image results.
- Host access (Google Search domains only): the filters run on results pages.
```

## Maintainer notes

- **Release.** Icons and short description ship inside the package and go live only with a higher `version` in `manifest.json` on the default branch. `main` still has the old neon popup, the branch `refresh/minimal-ui-and-store-ci` the new one, and **both are on 2.5.3**. Without a bump Chrome rejects the upload (`PKG_INVALID_VERSION_NUMBER`). The screenshots show the new popup, so upload them together with that release.
- **Edge package.** Build it with `store-kit\Build-EdgePackages.ps1 -Only Search -Local`, and again after every version bump.
- **Privacy policy.** The URL points at `main`. The updated text (adds `downloads` and `webNavigation`, mentions `-noai`) is visible there after the merge.
- **Chrome update.** Name and link of the listing stay the same. Screenshots, tiles and description can be changed in the dashboard without a new package (they go through review). Icon and short description come from the package.
- **Fixed 2026-11-24: "Block Keywords".** The Filters tab saved keywords, but the content script never applied them. `content_scripts/link_filter.js` now hides results that contain a keyword (whole word or whole phrase, case-insensitive, including umlauts and symbols such as `c++`). It applies to the "All" tab only, like the domain blocker and highlighting. Verified with the real script on a rebuilt results page (6 cases; the test fails with the old file). Because code changed, this version needs a release with a higher version anyway.
- **Known gaps (not advertised).** "Latest Posts" (Hide Modules) has no rule behind it. Hiding favicons and the "Unpack More" menu exist in the code but have no switch in the popup. Infinite scroll runs on the "All" tab only, not on Images, Videos, News or Shopping. Settings live in `chrome.storage.local` and are not synced through the browser account.
- **Not tested.** Only against the rebuilt results page. A live test against the current Google layout is still open, especially for hiding modules and tabs, because Google changes its class names often.
