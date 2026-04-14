#!/bin/sh
# Rebuild dist/dzarlax.css from source files
cd "$(dirname "$0")"

cat \
  tokens/colors.css \
  tokens/typography.css \
  tokens/spacing.css \
  themes/dark.css \
  base/reset.css \
  base/typography.css \
  base/layout.css \
  base/utilities.css \
  components/buttons.css \
  components/cards.css \
  components/forms.css \
  components/tables.css \
  components/badges.css \
  components/nav.css \
  components/toggle.css \
  components/footer.css \
  components/spinner.css \
  components/hero.css \
  components/timeline.css \
  components/empty-state.css \
  > dist/dzarlax.css

echo "Built dist/dzarlax.css ($(wc -l < dist/dzarlax.css) lines)"

# Minified version (no dependencies — uses Python for safe CSS minification)
python3 -c "
import re, sys
css = sys.stdin.read()
css = re.sub(r'/\*[\s\S]*?\*/', '', css)
css = re.sub(r'\s+', ' ', css)
css = re.sub(r'\s*([{}:;,>~+])\s*', r'\1', css)
css = re.sub(r';}', '}', css)
css = css.strip()
sys.stdout.write(css)
" < dist/dzarlax.css > dist/dzarlax.min.css

echo "Built dist/dzarlax.min.css ($(wc -c < dist/dzarlax.min.css) bytes)"
