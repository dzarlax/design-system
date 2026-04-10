# dzarlax.dev Design System

Unified visual language for all personal projects. CSS-first, zero dependencies, works with any stack.

## Quick start

```html
<link rel="stylesheet" href="dist/dzarlax.css">
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

## Preview

Open `docs/preview.html` in a browser to see all components.

## Used in

- [Book](https://book.dzarlax.dev) — self-hosted Calendly
- [Health Dashboard](https://health.dzarlax.dev) — health metrics
- [Evening News](https://news.dzarlax.dev) — AI news aggregator
- [Authentik](https://auth.dzarlax.dev) — SSO login
