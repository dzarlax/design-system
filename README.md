# dzarlax.dev Design System

Unified visual language for all personal projects — consistent tokens, components, and dark mode across every site without duplicating CSS.

CSS-first, minimal vanilla JS, zero npm dependencies, works with any stack.

**Live preview:** [dzarlax.github.io/design-system](https://dzarlax.github.io/design-system/)

---

## Quick start

### CDN (prototyping, dev)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/dzarlax/design-system@main/dist/dzarlax.css">
<script src="https://cdn.jsdelivr.net/gh/dzarlax/design-system@main/dist/dzarlax.js" defer></script>
```

> **Note:** jsdelivr `@main` can cache stale content for hours, and jsdelivr has been observed to pin a 404 at its edge when its first fetch races a fresh tag push (purge does not recover it). For production, **bake assets into your build** — see `Auto-update in CI` below, or `dzarlax/website`'s deploy.yml for the canonical sed-rewrite pattern.

### Docker (production — works offline)

```dockerfile
RUN curl -fsSL https://github.com/dzarlax/design-system/releases/latest/download/dzarlax.css \
    -o /app/static/dzarlax.css && \
    curl -fsSL https://github.com/dzarlax/design-system/releases/latest/download/dzarlax.js \
    -o /app/static/dzarlax.js
```

```html
<link rel="stylesheet" href="/static/dzarlax.css">
<script src="/static/dzarlax.js" defer></script>
```

### Go (embed into binary)

```bash
curl -fsSL https://github.com/dzarlax/design-system/releases/latest/download/dzarlax.js \
    -o internal/ui/dsjs.go  # then wrap as Go string constant
```

See `CLAUDE.md` for the full Go embedding pattern.

### Auto-update in CI

```yaml
- name: Download design system
  run: |
    LATEST=$(gh api repos/dzarlax/design-system/releases/latest --jq '.tag_name')
    curl -fsSL "https://github.com/dzarlax/design-system/releases/download/${LATEST}/dzarlax.css" -o static/dzarlax.css
    curl -fsSL "https://github.com/dzarlax/design-system/releases/download/${LATEST}/dzarlax.js"  -o static/dzarlax.js
```

## Components

### CSS components (no JS required)

| Component | Classes |
|---|---|
| **Buttons** | `.btn`, `.btn--primary`, `.btn--secondary`, `.btn--ghost`, `.btn--danger`, `.btn--small`, `.btn--icon` |
| **Badges** | `.badge`, `.badge--success`, `.badge--warning`, `.badge--danger`, `.badge--neutral` |
| **Navigation** | `.tab-nav` (tabs), `.navbar` (top bar), `.navbar.navbar--pill` (editorial pill — collapses into a slide-out drawer at `≤ 768px` when given `.active`) |
| **Theme toggle** | `.theme-toggle` — 44×24 switch track with a sliding thumb on `[dark-mode]` |
| **Lang switcher** | `.lang-switcher`, `.lang-btn`, `.lang-btn.active` |
| **Forms** | `.form-input`, `.form-select`, `.form-label`, `.form-group` |
| **Cards** | `.card`, `.card__header`, `.card__body` |
| **Tables** | `<table>` inside `.table-wrap` |
| **Alerts** | `.alert`, `.alert--success`, `.alert--warning`, `.alert--danger` |

### JS components (`dzarlax.js`)

#### Nav drawer — wires a hamburger to a slide-out `.navbar--pill`

```html
<button class="hamburger" data-ds-nav-toggle="#mainNav" aria-controls="mainNav" aria-expanded="false">
  <span class="hamburger__line"></span>
  <span class="hamburger__line"></span>
  <span class="hamburger__line"></span>
</button>
<nav id="mainNav" class="navbar navbar--pill">...</nav>
```

Auto-initializes on page load. Toggles `.active` on the button + the target. Closes on Escape, outside-click, or click on any `[data-ds-nav-overlay]`. Re-init with `DS.NavDrawer.init()` after dynamic DOM changes.

#### Combobox — searchable select with keyboard nav

```html
<div data-ds-combobox>
  <input type="text" placeholder="Search...">
  <ul>
    <li data-value="food">Food</li>
    <li data-value="transport">Transport</li>
  </ul>
  <input type="hidden" name="category">
</div>
```

Auto-initializes on page load. JS API:

```js
DS.setValue(el, 'food')          // select by value
DS.clearValue(el)                // clear selection
DS.updateItems(el, liElements)   // replace options in-place

el.addEventListener('ds:change', e => console.log(e.detail.value))
```

## Structure

```
tokens/          CSS custom properties (colors, typography, spacing, shadows)
tokens/tokens.json   Canonical source — `colors.css`, `shadows.css`, `themes/dark.css`,
                     and `tokens/ios/DesignSystemColors.swift` are generated from it
                     by `bin/gen-tokens.py` (runs first in build.sh).
base/            Reset, base typography, layout, utilities
components/      All CSS components
themes/          Dark mode ([dark-mode] attribute, generated)
brand/           Logo SVGs + PNGs (icon, wordmark, wordmark-dev)
js/              Vanilla JS components (combobox, nav-drawer, ...)
bin/             Build-step scripts (currently: gen-tokens.py)
dist/            Bundled dzarlax.css + dzarlax.js (generated — do not edit)
docs/            Preview page (open docs/preview.html locally)
```

## Design principles

- **Warm ivory** background (#FCFAF7) — not cold white
- **Dark graphite** accent (#18181B) — primary buttons, strong text
- **Georgia** for headings, system fonts for body
- **8px** standard radius, subtle shadows
- Dark mode via `[dark-mode]` HTML attribute

## Tokens

All values are CSS custom properties. Override any token in your project:

```css
:root {
    --accent: #2563eb; /* switch to blue accent */
}
```

Key tokens: `--bg`, `--surface`, `--surface-2`, `--accent`, `--text`, `--text-secondary`, `--text-tertiary`, `--border`, `--radius`, `--radius-sm`, `--radius-lg`, `--shadow`, `--shadow-sm`, `--shadow-lg`, `--good`, `--warn`, `--danger`, `--container-lg`, `--transition`.

## Dark mode

```html
<html dark-mode>
```

Or toggle with JS:

```js
document.documentElement.toggleAttribute('dark-mode');
```

## Brand footer

```html
<a href="https://dzarlax.dev" class="dzarlax-footer">
    <span class="dzarlax-footer-icon">dz</span>
    <span>built by dzarlax</span>
</a>
```

## Build

```bash
./build.sh    # rebuilds dist/dzarlax.css + dist/dzarlax.js from source files
```

On every push to `main`, GitHub Actions rebuilds and deploys to GitHub Pages.

## Releases

Every push to `main` that changes source files (`tokens/**`, `components/**`, `themes/**`, `base/**`, `brand/**`, `js/**`, `bin/**`, `build.sh`) creates a release automatically. The bump level is parsed from the commit messages since the last tag:

- `feat:` → **MINOR**
- `feat!:` (any type with `!:`) or a `BREAKING CHANGE:` line in the body → **MAJOR**
- everything else (`fix:`, `chore:`, `docs:`, …) → **PATCH**

Override via a `Release-As: major|minor|patch` footer in any commit body in the range. `workflow_dispatch` is wired for manual re-tagging without a content commit (rare; used when an external CDN poisons-caches a tag).

## Local preview

Open `docs/preview.html` in a browser — no server needed.

## Used in

- [dzarlax.dev](https://dzarlax.dev) — personal lander + Hugo blog (bakes the bundle into the deploy tree at build time)
- [Book](https://book.dzarlax.dev) — self-hosted booking
- [Health Dashboard](https://health.dzarlax.dev) — health metrics
- [Evening News](https://news.dzarlax.dev) — AI news aggregator
- Authentik — SSO login
- `health-sync` iOS app — consumes `tokens/ios/DesignSystemColors.swift`
