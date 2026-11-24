# Store assets – Search Filter & Site Blocker

Everything for the store listings of Search Filter & Site Blocker (Search Optimizer) in one place: images, logo sources and the store texts, for the Chrome Web Store and Microsoft Edge Add-ons at once. One image set serves both stores (the sizes are accepted by both).

This folder is not part of the extension package. The packager (`.github/scripts/package-extension.mjs`) skips `store-assets/`, and changes here do not start a release.

## Contents

```
store-assets/
├─ listing.md                          store texts, search terms and field values (both stores; store-only parts are marked)
├─ screenshots/                        5 × 1280×800
├─ promo-small-440x280.png             small promo tile
├─ promo-marquee-1400x560.png          large promo tile (Chrome "marquee", Edge "large")
├─ brand/
│  ├─ logo.svg                         logo master (128 px grid)
│  ├─ logo-small.svg                   simplified version for 16 and 32 px
│  ├─ logo-300x300.png                 Edge logo
│  └─ logo-512.png
├─ _source/                            generator for all images and icons
│  ├─ build.mjs                        screenshots and promo tiles
│  ├─ make-icons.mjs                   icons and logos from brand/*.svg
│  └─ render.mjs                       helper (headless Edge or Chrome)
└─ Search-<version>.zip                built package (git-ignored)
```

## Which file goes where

| Store field | File | Chrome | Edge |
|---|---|---|---|
| Extension icon 128 × 128 | `../icons/icon128.png` (inside the package) | store icon | automatic |
| Logo 300 × 300 | `brand/logo-300x300.png` | – | logo |
| Screenshots | `screenshots/screenshot-1-…` to `screenshot-5-…` | up to 5 | up to 6 |
| Small tile 440 × 280 | `promo-small-440x280.png` | required | required |
| Large tile 1400 × 560 | `promo-marquee-1400x560.png` | optional | optional |
| Package | `Search-<version>.zip` | built by the release pipeline | upload by hand the first time, pipeline afterwards |

Screenshot order (the first counts most) and the optional captions for Edge:

1. `screenshot-1-block-sites.png` – "Block sites you never want to see, and star the ones you trust"
2. `screenshot-2-hide-ai-overviews-and-clutter.png` – "Hide AI Overviews, ads, People also ask and other clutter"
3. `screenshot-3-before-and-after.png` – "The same search before and after: a cleaner results page"
4. `screenshot-4-infinite-scroll.png` – "Infinite scroll with floating top and bottom buttons"
5. `screenshot-5-search-operators.png` – "Advanced Tools panel with one-click search operators"

## File naming

Files that apply to one store only carry the store in their name (`…-chrome.…` or `…-edge.…`). Everything without such a suffix is shared by both stores.

## Regenerate the images

Needs Node 20 and Microsoft Edge (or Chrome). From the extension folder:

```
node store-assets/_source/build.mjs            # all screenshots and both tiles
node store-assets/_source/build.mjs 3 promo    # only screenshot 3 and the tiles
node store-assets/_source/make-icons.mjs       # icons/icon16/32/48/128.png and brand/logo-*.png
```

- The popup in the images is the real `popup.html` with `popup.css` and `popup.js`, filled with example data and a small `chrome.*` stand-in. On the rebuilt results page the real content scripts run (`link_filter.js`, `operators_panel.js`, `image_tools.js`): the block and star buttons, highlighting, hidden modules, scroll buttons and the Advanced Tools panel are drawn by the extension itself.
- Rebuilt are only the results page itself (made-up pages on the reserved `.example` domain, defined in `build.mjs`), the headlines and the background. The images say "Simplified illustration".
- The version number in the popup is hidden in the images so they do not go stale.
- To change the logo, edit `brand/logo.svg`, then run `make-icons.mjs` and `build.mjs`.

## Notes

- The logo is an original mark (a magnifier with a results list on a tile) and contains no shapes or colors from the Google logo.
- The images show the new popup from the branch `refresh/minimal-ui-and-store-ci`. `main` still has the old neon popup.
- The texts describe only features that exist in the code. A live test against the current Google layout is still open.
