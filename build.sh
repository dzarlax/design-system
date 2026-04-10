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
  components/buttons.css \
  components/cards.css \
  components/forms.css \
  components/tables.css \
  components/badges.css \
  components/nav.css \
  components/toggle.css \
  components/footer.css \
  components/spinner.css \
  > dist/dzarlax.css

echo "Built dist/dzarlax.css ($(wc -l < dist/dzarlax.css) lines)"
