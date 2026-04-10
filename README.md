# dzarlax.dev Design System

Unified visual language for all personal projects. CSS-first, zero dependencies, works with any stack.

## Quick start

Pinned version (recommended):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/dzarlax/design-system@v1.0.0/dist/dzarlax.css">
```

Latest from main:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/dzarlax/design-system@main/dist/dzarlax.css">
```

GitHub Pages:

```html
<link rel="stylesheet" href="https://dzarlax.github.io/design-system/dist/dzarlax.css">
```

## Structure

```
tokens/          CSS custom properties (colors, typography, spacing)
base/            Reset, base typography, layout
components/      Buttons, cards, forms, tables, badges, nav, toggle, footer, spinner
themes/          Dark mode ([dark-mode] attribute)
brand/           Logo SVGs + PNGs (icon, wordmark, wordmark-dev)
dist/            Single bundled CSS file
docs/            Preview page (open docs/preview.html in browser)
```

## Design principles

- **Warm ivory** background (#FCFAF7) — not cold white, not paper yellow
- **Dark graphite** accent (#18181B) — primary buttons, strong text
- **Georgia** for headings, system fonts for body
- **8px** standard radius, subtle shadows
- Dark mode via `[dark-mode]` HTML attribute

## Tokens

All design values are CSS custom properties. Override any token in your project:

```css
:root {
    --accent: #3B82F6; /* switch to blue accent */
}
```

## Dark mode

```html
<html dark-mode>
```

Or toggle with JS:

```js
document.documentElement.toggleAttribute('dark-mode');
```

## Brand footer

Drop into any project:

```html
<a href="https://dzarlax.dev" class="dzarlax-footer">
    <span class="dzarlax-footer-icon">dz</span>
    <span>built by dzarlax</span>
</a>
```

## Build

```bash
./build.sh    # rebuilds dist/dzarlax.css from source files
```

On every push to `main`, GitHub Actions rebuilds the bundle and deploys to GitHub Pages.

## Releases

Automatic: every push to `main` that changes CSS/brand files creates a new patch release (v1.0.0 → v1.0.1 → v1.0.2...).

To bump minor/major manually:

```bash
git tag v2.0.0
git push origin v2.0.0
```

Auto-releases will continue from the new base (v2.0.1, v2.0.2...).

## Preview

Live: [dzarlax.github.io/design-system](https://dzarlax.github.io/design-system/)

Or open `docs/preview.html` locally.

## Used in

- [Book](https://book.dzarlax.dev) — self-hosted Calendly
- [Health Dashboard](https://health.dzarlax.dev) — health metrics
- [Evening News](https://news.dzarlax.dev) — AI news aggregator
- Authentik — SSO login
