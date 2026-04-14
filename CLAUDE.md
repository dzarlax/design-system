# CLAUDE.md — design-system

Unified design system for dzarlax.dev. CSS-first, minimal JS, zero npm dependencies, works with any stack.

## Structure

```
tokens/          CSS custom properties (colors, typography, spacing/shadows)
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

Concatenation order matters: tokens → themes → base → components. Only change in `build.sh`.  
JS: all `js/*.js` files are concatenated into `dist/dzarlax.js`.

## Deploy

- GitHub Actions on push to `main` builds bundle and deploys to GitHub Pages
- GitHub Pages: `https://dzarlax.github.io/design-system/`
- CSS CDN: `https://cdn.jsdelivr.net/gh/dzarlax/design-system@main/dist/dzarlax.css`
- JS CDN: `https://cdn.jsdelivr.net/gh/dzarlax/design-system@main/dist/dzarlax.js`

**CDN caching warning:** jsdelivr `@main` can serve stale content for hours after a push. For production, always bake assets into the build rather than loading from CDN at runtime.

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
| `--surface-2` | `#E8E6E3` | — |
| `--accent` | `#18181B` (graphite) | `#F5F5F5` |
| `--text` | `#1A1A1E` | `#F5F5F5` |
| `--text-secondary` | rgba(26,26,30,0.7) | — |
| `--text-tertiary` | rgba(26,26,30,0.5) | — |
| `--border` | rgba(0,0,0,0.08) | — |
| `--radius-lg` | 12px | — |
| `--radius` | 8px | — |
| `--radius-sm` | 4px | — |
| `--shadow-sm` / `--shadow` / `--shadow-lg` | subtle → prominent | — |
| `--good` / `--warn` / `--danger` | status colors | — |
| `--container-lg` | 1200px | — |
| `--transition` | 0.18s ease | — |

## Brand

- Icon: `dz` on rounded square (#2B2B2B / #F5F0E8)
- Wordmark: Georgia serif, `dzarlax` or `dzarlax.dev`
- Variants: light (for light bg) and dark (for dark bg)

## Dark mode

Primary: HTML attribute `[dark-mode]`. Fallback: `prefers-color-scheme: dark`.

```js
document.documentElement.toggleAttribute('dark-mode');   // toggle
document.documentElement.setAttribute('light-mode', ''); // force light
```

Priority: `[dark-mode]` / `[light-mode]` attribute > system preference > light default.

## Component classes reference

| Component | Key classes |
|---|---|
| Buttons | `.btn`, `.btn--primary`, `.btn--secondary`, `.btn--ghost`, `.btn--danger`, `.btn--small`, `.btn--icon` |
| Badges | `.badge`, `.badge--success`, `.badge--warning`, `.badge--danger`, `.badge--neutral` |
| Navigation | `.tab-nav`, `.tab-nav a` (also works with `button`) |
| Forms | `.form-input`, `.form-select`, `.form-label`, `.form-group` |
| Combobox | `[data-ds-combobox]` (JS auto-init), `DS.*` API |
| Tables | standard `<table>` inside `.table-wrap` |
| Cards | `.card`, `.card__header`, `.card__body` |

## Projects using this system

- Book (book.dzarlax.dev) — source of truth, tokens extracted from here
- Health Dashboard (health.dzarlax.dev)
- Evening News (news.dzarlax.dev)
- Authentik (custom.css)

## Rules

- `dist/dzarlax.css` and `dist/dzarlax.js` are **generated files** — never edit manually
- Add new CSS components to `components/`, new JS components to `js/`, then add both to `build.sh`
- No npm, PostCSS, or build tools — pure CSS and vanilla JS only
- Update preview (`docs/preview.html`) when adding new components
- No Docker images needed — static files via GitHub Pages
