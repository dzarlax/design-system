# CLAUDE.md — design-system

Единая дизайн-система dzarlax.dev. CSS-first, без зависимостей, работает с любым стеком.

## Структура

```
tokens/          CSS custom properties (цвета, типографика, отступы/тени)
base/            Reset, базовая типографика, лейаут
components/      Кнопки, карточки, формы, таблицы, бейджи, навигация, тоглы, футер, спиннер
themes/          Dark mode ([dark-mode] атрибут)
brand/           Лого: SVG + PNG (icon, wordmark, wordmark-dev), footer-snippet.html
dist/            Собранный единый CSS-файл
docs/            Превью-страница со всеми компонентами
```

## Сборка

```bash
./build.sh        # Пересобирает dist/dzarlax.css из исходников
```

Порядок конкатенации важен: tokens → themes → base → components. Менять только в `build.sh`.

## Деплой

- GitHub Actions при пуше в `main` собирает бандл и деплоит на GitHub Pages
- GitHub Pages: `https://dzarlax.github.io/design-system/`
- jsDelivr CDN: `https://cdn.jsdelivr.net/gh/dzarlax/design-system@main/dist/dzarlax.css`

## Подключение в проектах

```html
<!-- CDN -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/dzarlax/design-system@main/dist/dzarlax.css">

<!-- Или отдельные модули -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/dzarlax/design-system@main/tokens/colors.css">
```

Для Go-проектов можно embed'ить `dist/dzarlax.css` через `//go:embed`.

## Ключевые токены

| Токен | Light | Dark |
|---|---|---|
| `--bg` | `#FCFAF7` (warm ivory) | `#1A1D21` |
| `--surface` | `#FFFFFF` | `#22252A` |
| `--accent` | `#18181B` (graphite) | `#F5F5F5` |
| `--text` | `#1A1A1E` | `#F5F5F5` |
| `--font` | system fonts (SF Pro, system-ui) | |
| `--font-serif` | Georgia, Times New Roman | |
| `--radius` | 8px | |
| `--transition` | 0.18s ease | |

## Бренд

- Icon: `dz` на скруглённом квадрате (#2B2B2B фон / #F5F0E8 текст)
- Wordmark: Georgia serif, `dzarlax` или `dzarlax.dev`
- Варианты: light (для светлого фона) и dark (для тёмного фона)

## Dark mode

Через HTML-атрибут `[dark-mode]`, НЕ через `prefers-color-scheme`:

```js
document.documentElement.toggleAttribute('dark-mode');
```

## Проекты на этой системе

- Book (book.dzarlax.dev) — source of truth, отсюда извлечены токены
- Health Dashboard (health.dzarlax.dev)
- Evening News (news.dzarlax.dev)
- Authentik (custom.css)

## Правила

- `dist/dzarlax.css` — **генерируемый файл**, не редактировать вручную. Менять исходники и запускать `build.sh`
- Новые компоненты добавлять в `components/`, затем добавить в `build.sh`
- Не добавлять зависимостей (npm, PostCSS и т.д.) — чистый CSS
- Превью (`docs/preview.html`) обновлять при добавлении новых компонентов
- Docker образы НЕ нужны — это статика, деплоится через GitHub Pages
