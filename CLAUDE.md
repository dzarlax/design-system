# CLAUDE.md — design-system

Unified design system for dzarlax.dev. CSS-first, zero dependencies, works with any stack.

## Structure

```
tokens/          CSS custom properties (colors, typography, spacing/shadows)
base/            Reset, base typography, layout
components/      Buttons, cards, forms, tables, badges, nav, toggle, footer, spinner
themes/          Dark mode ([dark-mode] attribute)
brand/           Logo: SVG + PNG (icon, wordmark, wordmark-dev), footer-snippet.html
dist/            Single bundled CSS file
docs/            Preview page with all components
```

## Build

```bash
./build.sh        # Rebuilds dist/dzarlax.css + dist/dzarlax.min.css
```

Concatenation order matters: tokens → themes → base → components. Only change in `build.sh`.

## Deploy

- GitHub Actions on push to `main` builds bundle and deploys to GitHub Pages
- GitHub Pages: `https://dzarlax.github.io/design-system/`
- jsDelivr CDN: `https://cdn.jsdelivr.net/gh/dzarlax/design-system@main/dist/dzarlax.css`

## Usage in projects

### CDN (dev/prototyping)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/dzarlax/design-system@v1.0.0/dist/dzarlax.css">
```

Not suitable for production — won't work offline.

### Bake into Docker image (production)

Add CSS download step during Docker build:

```dockerfile
ADD https://github.com/dzarlax/design-system/releases/download/v1.0.0/dzarlax.css /app/static/dzarlax.css
```

Or via curl (more control):

```dockerfile
RUN curl -fsSL https://github.com/dzarlax/design-system/releases/download/v1.0.0/dzarlax.css -o /app/static/dzarlax.css
```

Then in HTML:

```html
<link rel="stylesheet" href="/static/dzarlax.css">
```

### Go projects (embed)

Download CSS into the repo and embed:

```bash
curl -fsSL https://github.com/dzarlax/design-system/releases/download/v1.0.0/dzarlax.css -o internal/ui/static/dzarlax.css
```

```go
import _ "embed"

//go:embed static/dzarlax.css
var designSystemCSS string
```

### Python/FastAPI projects

Download to static/ and serve via StaticFiles:

```bash
curl -fsSL https://github.com/dzarlax/design-system/releases/download/v1.0.0/dzarlax.css -o web/static/css/dzarlax.css
```

### React/Next.js projects

```bash
curl -fsSL https://github.com/dzarlax/design-system/releases/download/v1.0.0/dzarlax.css -o public/dzarlax.css
```

### Auto-update in CI

Fetch the latest release during your project's build:

```yaml
- name: Download design system
  run: |
    LATEST=$(gh api repos/dzarlax/design-system/releases/latest --jq '.tag_name')
    curl -fsSL "https://github.com/dzarlax/design-system/releases/download/${LATEST}/dzarlax.css" \
      -o static/dzarlax.css
```

## Key tokens

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#FCFAF7` (warm ivory) | `#1A1D21` |
| `--surface` | `#FFFFFF` | `#22252A` |
| `--accent` | `#18181B` (graphite) | `#F5F5F5` |
| `--text` | `#1A1A1E` | `#F5F5F5` |
| `--font` | system fonts (SF Pro, system-ui) | |
| `--font-serif` | Georgia, Times New Roman | |
| `--radius` | 8px | |
| `--transition` | 0.18s ease | |

## Brand

- Icon: `dz` on a rounded square (#2B2B2B background / #F5F0E8 text)
- Wordmark: Georgia serif, `dzarlax` or `dzarlax.dev`
- Variants: light (for light backgrounds) and dark (for dark backgrounds)

## Dark mode

Primary: HTML attribute `[dark-mode]`. Fallback: `prefers-color-scheme: dark` (auto-applies when no explicit choice).

```js
// Toggle dark mode explicitly
document.documentElement.toggleAttribute('dark-mode');

// Force light mode (overrides system preference)
document.documentElement.setAttribute('light-mode', '');
```

Priority: `[dark-mode]` or `[light-mode]` attribute > system `prefers-color-scheme` > light default.

## Projects using this system

- Book (book.dzarlax.dev) — source of truth, tokens extracted from here
- Health Dashboard (health.dzarlax.dev)
- Evening News (news.dzarlax.dev)
- Authentik (custom.css)

## Rules

- `dist/dzarlax.css` is a **generated file** — do not edit manually. Change source files and run `build.sh`
- Add new components to `components/`, then add to `build.sh`
- No dependencies (npm, PostCSS, etc.) — pure CSS only
- Update preview (`docs/preview.html`) when adding new components
- No Docker images needed — static files deployed via GitHub Pages
