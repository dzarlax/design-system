# CLAUDE.md — design-system

Unified design system for dzarlax.dev. CSS-first, minimal JS, zero npm dependencies, works with any stack.

## Structure

```
tokens/          CSS custom properties (colors, typography, spacing/shadows)
tokens/tokens.json   Canonical light+dark values — source of truth, mirrored to CSS + iOS
tokens/ios/      Swift extensions for iOS apps (DesignSystemColors.swift)
base/            Reset, base typography, layout
components/      Buttons, cards, forms, tables, badges, nav, toggle, footer, spinner, combobox
themes/          Dark mode ([dark-mode] attribute)
brand/           Logo: SVG + PNG (icon, wordmark, wordmark-dev), footer-snippet.html
js/              Component JavaScript (combobox.js, ...)
dist/            Single bundled CSS + JS files
docs/            Preview page with all components
```

## Build

```bash
./build.sh        # Rebuilds dist/dzarlax.css + dist/dzarlax.min.css + dist/dzarlax.js
```

No npm, no package.json — pure shell script. What `build.sh` does:

1. **Tokens regen** (if `tokens/tokens.json` is newer than its mirrors): runs `bin/gen-tokens.py` to emit `tokens/colors.css`, `themes/dark.css`, and `tokens/ios/DesignSystemColors.swift` from `tokens/tokens.json` (the canonical source).
2. **CSS concat** (order matters): `tokens/*.css` → `themes/*.css` → `base/*.css` → `components/*.css` → `dist/dzarlax.css`
3. **CSS minify** (inline Python): strips comments, collapses whitespace → `dist/dzarlax.min.css`
4. **JS concat**: all `js/*.js` → `dist/dzarlax.js`

## Deploy

- GitHub Actions on push to `main` builds bundle and deploys to GitHub Pages
- GitHub Pages: `https://dzarlax.github.io/design-system/`
- CSS CDN: `https://cdn.jsdelivr.net/gh/dzarlax/design-system@main/dist/dzarlax.css`
- JS CDN: `https://cdn.jsdelivr.net/gh/dzarlax/design-system@main/dist/dzarlax.js`

**CDN caching warning:** jsdelivr `@main` can serve stale content for hours after a push. For production, always bake assets into the build rather than loading from CDN at runtime.

**CDN poisoning incidents (May 2026):** jsdelivr cached a 404 for `v1.2.0` and `v1.2.1` when its first GitHub fetch raced the tag push — both Cloudflare and Fastly edges pinned the failure response, and `purge.jsdelivr.net` reported success but subsequent fetches kept missing. statically.io 301-redirects the `/<tag>/` URL form to `http://...@<tag>/...` (HTTPS downgrade, their bug) which trips any strict CSP `style-src https://...`. Lesson: **consuming projects must bake the bundle** into their deploy artifact (`curl -fsSL https://github.com/dzarlax/design-system/releases/download/<tag>/dzarlax.{css,js}` → same-origin `/assets/ds/...?v=<tag>` with sed rewriting `<link>`/`<script>` URLs at build time). See `.github/workflows/deploy.yml` in `dzarlax/website` for the canonical pattern. Sources can keep CDN URLs for local previews; CI rewrites only the deploy output.

**Versioning automation:** `release.yml` parses commit messages since the last tag — `feat:` → MINOR, `feat!:` / `BREAKING CHANGE:` → MAJOR, anything else → PATCH. `Release-As: major|minor|patch` footer in any commit body overrides. `workflow_dispatch` is available for manual re-tag (used when an external CDN poisons-caches a tag and we need to bump past it without a content commit). Force-pushing an amended commit that touches one of the `paths:` triggers re-fires the workflow → can produce back-to-back tags (e.g. `v1.2.2` + `v1.2.3` from one logical change); harmless but noisy in the release list.

## JS Components

### Combobox (`js/combobox.js`)

Searchable select with keyboard navigation and clear button.

```html
<div data-ds-combobox>
  <input type="text" placeholder="Search...">
  <ul>
    <li data-value="food">Food</li>
    <li data-value="transport">Transport</li>
  </ul>
  <input type="hidden" name="category">  <!-- optional: receives selected value -->
</div>
```

**Auto-init:** all `[data-ds-combobox]` elements initialize on `DOMContentLoaded`.

**JS API:**
```js
DS.Combobox(el)              // init a single element
DS.init()                    // re-init all [data-ds-combobox] on page
DS.setValue(el, value)       // programmatically select by value
DS.clearValue(el)            // clear selection
DS.updateItems(el, liArray)  // replace list items in-place (no re-init)
```

**Events:**
```js
el.addEventListener('ds:change', e => {
  console.log(e.detail.value, e.detail.label)
})
```

**`DS.updateItems` pattern** — use this to repopulate options dynamically. It updates the internal `items` array and DOM in-place without re-initializing, which avoids duplicate clear buttons and doubled event listeners:
```js
var items = categories.map(c => {
  var li = document.createElement('li');
  li.dataset.value = c.slug;
  li.textContent = c.name;
  return li;
});
DS.updateItems(el, items);
```

**Never** reset `el._dsCombobox = false` and call `DS.Combobox(el)` again — it appends a second clear button.

## Usage in projects

### CDN (dev/prototyping only)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/dzarlax/design-system@main/dist/dzarlax.css">
<script src="https://cdn.jsdelivr.net/gh/dzarlax/design-system@main/dist/dzarlax.js" defer></script>
```

Not suitable for production — CDN caches `@main` aggressively; JS updates may not propagate for hours.

### Go projects — bake into binary (production)

Copy `dist/dzarlax.js` content directly into a Go string constant:

```go
// internal/ui/dsjs.go
package ui

var dsJS = `/* dzarlax.dev Design System ... */
(function () { ... }());
`
```

Inline in template:
```go
var indexHTML = `...
<script>` + dsJS + `</script>
<script>` + jsApp + `</script>
...`
```

To update: copy latest `dist/dzarlax.js` from this repo into `dsjs.go`.

### Bake into Docker image

```dockerfile
RUN curl -fsSL https://github.com/dzarlax/design-system/releases/download/v1.0.0/dzarlax.js \
    -o /app/static/dzarlax.js
```

### Auto-update in CI

```yaml
- name: Download design system
  run: |
    LATEST=$(gh api repos/dzarlax/design-system/releases/latest --jq '.tag_name')
    curl -fsSL "https://github.com/dzarlax/design-system/releases/download/${LATEST}/dzarlax.css" -o static/dzarlax.css
    curl -fsSL "https://github.com/dzarlax/design-system/releases/download/${LATEST}/dzarlax.js"  -o static/dzarlax.js
```

## Key tokens

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#FCFAF7` (warm ivory) | `#1A1D21` |
| `--surface` | `#FFFFFF` | `#22252A` |
| `--surface-2` | `#E8E6E3` | `#2A2D32` |
| `--surface-3` | `#DCDAD7` | `#33363B` (elevated/modal) |
| `--accent` | `#18181B` (graphite) | `#F5F5F5` |
| `--accent-foreground` | `#FFFFFF` | `#1A1A1E` (use on `--accent`) |
| `--text` | `#1A1A1E` | `#F5F5F5` |
| `--text-secondary` | rgba(26,26,30,0.7) | rgba(245,245,245,0.7) |
| `--text-tertiary` | rgba(26,26,30,0.5) | rgba(245,245,245,0.5) |
| `--border` | rgba(0,0,0,0.08) | rgba(255,255,255,0.08) |
| `--good` | `#16a34a` | `#22c55e` (brightened) |
| `--warn` | `#d97706` | `#f59e0b` (brightened) |
| `--danger` | `#dc2626` | `#ef4444` (brightened) |
| `--good-bg` / `--warn-bg` / `--danger-bg` | pastel | translucent rgba 15% |
| `--heart` / `--activity` / `--sleep` / `--cardio` | saturated | brightened (`fb7185`/`34d399`/`a78bfa`/`38bdf8`) |
| `--radius-lg` / `--radius` / `--radius-sm` | 12px / 8px / 4px | — |
| `--shadow-sm` / `--shadow` / `--shadow-lg` | subtle → prominent | deeper alphas |
| `--container-lg` | 1200px | — |
| `--transition` | 0.18s ease | — |

## Brand

- Icon: `dz` on rounded square (#2B2B2B / #F5F0E8)
- Wordmark: Georgia serif, `dzarlax` or `dzarlax.dev`
- Variants: light (for light bg) and dark (for dark bg)

## Dark mode

Primary: HTML attribute `[dark-mode]`. Fallback: `prefers-color-scheme: dark`.

Priority: `[dark-mode]` / `[light-mode]` attribute > system preference > light default.

**A manual toggle MUST always set one of `[dark-mode]` or `[light-mode]` explicitly** — naively toggling only `[dark-mode]` breaks on system-dark browsers, because removing the attribute lets the `@media (prefers-color-scheme: dark)` rule (which is gated on `:root:not([light-mode])`) take over and force dark again. Symptom: the toggle button appears dead.

### Recommended: opt into `data-ds-theme-toggle` (auto-wire)

```html
<button class="theme-toggle" data-ds-theme-toggle aria-label="Toggle theme"></button>
```

The bundle's `js/theme-toggle.js` auto-wires every `[data-ds-theme-toggle]` on `DOMContentLoaded`: it resolves the initial theme (`localStorage[theme]` → `prefers-color-scheme` fallback), sets the right attribute on `<html>`, attaches a click handler that flips between the two attributes correctly, and re-syncs on live system-pref changes when no manual override is stored. Override the storage key with an attribute value: `data-ds-theme-toggle="my-key"`. Programmatic flip: `DS.Theme.apply('dark' | 'light')`.

For FOUC-free initial paint, also ship a tiny inline `<script>` in the page `<head>` BEFORE the DS bundle loads — the runtime handler runs after defer, which can be a paint or two too late on slow connections:

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem('theme');
      var dark = t === 'dark'
        || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.setAttribute(dark ? 'dark-mode' : 'light-mode', '');
    } catch (_) {}
  })();
</script>
```

### Manual: roll your own

If you can't use the auto-wire (e.g. you need bespoke transitions, framework-bound state, or a different storage key per toggle), the two-attribute pattern is:

```js
// Correct: explicit two-attribute toggle
var html = document.documentElement;
var next = html.hasAttribute('dark-mode') ? 'light' : 'dark';
if (next === 'dark') {
    html.setAttribute('dark-mode', '');
    html.removeAttribute('light-mode');
} else {
    html.removeAttribute('dark-mode');
    html.setAttribute('light-mode', '');
}
localStorage.setItem('theme', next);
```

## Component classes reference

| Component | Key classes |
|---|---|
| Buttons | `.btn`, `.btn--primary`, `.btn--secondary`, `.btn--ghost`, `.btn--danger`, `.btn--small`, `.btn--icon` |
| Badges | `.badge`, `.badge--success`, `.badge--warning`, `.badge--danger`, `.badge--neutral` |
| Navigation | `.tab-nav`, `.tab-nav a` (also works with `button`); pill nav `.navbar.navbar--pill` (collapses to slide-out drawer ≤ 768px when given `.active`) |
| Theme toggle | `.theme-toggle` — 44×24 switch track with sliding thumb on `[dark-mode]`. Add `data-ds-theme-toggle` to auto-wire the click handler (see "Dark mode") |
| Lang switcher | `.lang-switcher`, `.lang-btn`, `.lang-btn.active` |
| Forms | `.form-input`, `.form-select`, `.form-label`, `.form-group` |
| Combobox | `[data-ds-combobox]` (JS auto-init), `DS.*` API |
| Tables | standard `<table>` inside `.table-wrap` |
| Cards | `.card`, `.card__header`, `.card__body` |

## iOS / SwiftUI projects

For iOS apps, copy `tokens/ios/DesignSystemColors.swift` into the Xcode target.
It exposes the same tokens as `Color.dsBackground`, `Color.dsSurface`,
`Color.dsAccent`, etc., backed by `UITraitCollection`-aware
`UIColor(dynamicProvider:)`. They switch automatically with iOS dark mode — no
`@Environment(\.colorScheme)` plumbing needed at call sites.

When updating values: edit `tokens/tokens.json` (the canonical source), then
run `python3 bin/gen-tokens.py` (or `./build.sh`, which calls it first). The
generator emits `tokens/colors.css`, `themes/dark.css`, and
`tokens/ios/DesignSystemColors.swift` — those three files are **generated**
and should not be hand-edited. `bin/gen-tokens.py --check` exits non-zero if
the mirrors drift from the JSON; useful in CI.

## Projects using this system

- Book (book.dzarlax.dev) — source of truth, tokens extracted from here
- Health Dashboard (health.dzarlax.dev)
- Evening News (news.dzarlax.dev)
- Authentik (custom.css)
- health-sync iOS app (uses `tokens/ios/DesignSystemColors.swift`)

## Rules

- `dist/dzarlax.css` and `dist/dzarlax.js` are **generated files** — never edit manually
- Add new CSS components to `components/`, new JS components to `js/`, then add both to `build.sh`
- No npm, PostCSS, or build tools — pure CSS and vanilla JS only
- Update preview (`docs/preview.html`) when adding new components
- No Docker images needed — static files via GitHub Pages
