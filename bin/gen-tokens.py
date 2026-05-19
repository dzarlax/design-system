#!/usr/bin/env python3
"""Generate token mirrors from tokens/tokens.json (the canonical source).

Emits:
- tokens/colors.css         (light :root values)
- themes/dark.css           ([dark-mode] + @media prefers-color-scheme override)
- tokens/ios/DesignSystemColors.swift  (UITraitCollection-aware Color extensions)

Idempotent: re-running with no JSON changes produces byte-identical output.

Invoke directly (`python3 bin/gen-tokens.py`) or via `build.sh`, which calls
this script before the CSS concat step.
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOKENS = json.loads((ROOT / "tokens/tokens.json").read_text())
COLORS = TOKENS["color"]


# ─────────────────────────────────────────────────────────────────────────────
# Token resolution
# ─────────────────────────────────────────────────────────────────────────────

def _normalize_css(v: str) -> str:
    """Normalise rgba() commas to have a single space after each — matches the
    historical hand-edited CSS style and keeps diffs small."""
    return re.sub(r",\s*", ", ", v)


def get(name: str, mode: str) -> str:
    """Look up `name` (e.g. 'bg', 'brand-dark') for `mode` (light|dark)."""
    if name.startswith("brand-"):
        sub = name.split("-", 1)[1]
        return _normalize_css(COLORS["brand"][sub][mode])
    return _normalize_css(COLORS[name][mode])


# ─────────────────────────────────────────────────────────────────────────────
# CSS — tokens/colors.css
# ─────────────────────────────────────────────────────────────────────────────

CSS_LIGHT_GROUPS = [
    ("Brand core",            ["brand-dark", "brand-light"]),
    ("Backgrounds",           ["bg", "surface", "surface-2", "surface-3"]),
    ("Text",                  ["text", "text-secondary", "text-tertiary"]),
    ("Accent",                ["accent", "accent-hover", "accent-foreground"]),
    ("Borders",               ["border", "border-hover", "border-light"]),
    ("Status",                ["good", "good-bg", "warn", "warn-bg",
                               "danger", "danger-bg"]),
    ("Category (for dashboards)", ["heart", "activity", "sleep", "cardio"]),
]


def emit_colors_css() -> str:
    lines = ["/* dzarlax.dev Design System — Color Tokens */",
             "/* Generated from tokens/tokens.json by bin/gen-tokens.py — do not hand-edit. */",
             "",
             ":root {"]
    for i, (title, keys) in enumerate(CSS_LIGHT_GROUPS):
        if i > 0:
            lines.append("")
        lines.append(f"    /* {title} */")
        for k in keys:
            lines.append(f"    --{k}: {get(k, 'light')};")
    lines.append("}")
    return "\n".join(lines) + "\n"


# ─────────────────────────────────────────────────────────────────────────────
# CSS — tokens/shadows.css
# ─────────────────────────────────────────────────────────────────────────────

SHADOW_KEYS = ["sm", "default", "lg", "xl"]
SHADOWS = TOKENS.get("shadow", {})


def shadow_varname(key: str) -> str:
    """`default` → `--shadow`, otherwise `--shadow-<key>`."""
    return "--shadow" if key == "default" else f"--shadow-{key}"


def shadow_value(key: str, mode: str) -> str:
    return _normalize_css(SHADOWS[key][mode])


def emit_shadows_css() -> str:
    lines = [
        "/* dzarlax.dev Design System — Shadow Tokens (light) */",
        "/* Generated from tokens/tokens.json by bin/gen-tokens.py — do not hand-edit. */",
        "/* Dark-mode overrides live in themes/dark.css. */",
        "",
        ":root {",
    ]
    for k in SHADOW_KEYS:
        lines.append(f"    {shadow_varname(k)}: {shadow_value(k, 'light')};")
    lines.append("}")
    return "\n".join(lines) + "\n"


# ─────────────────────────────────────────────────────────────────────────────
# CSS — themes/dark.css
# ─────────────────────────────────────────────────────────────────────────────

CSS_DARK_GROUPS = [
    ("Backgrounds",           ["bg", "surface", "surface-2", "surface-3"]),
    ("Text",                  ["text", "text-secondary", "text-tertiary"]),
    ("Accent (inverted)",     ["accent", "accent-hover", "accent-foreground"]),
    ("Borders",               ["border", "border-hover", "border-light"]),
    ("Shadows (deeper for dark)", "__shadows__"),
    ("Status — foregrounds brightened, bgs muted",
        ["good", "good-bg", "warn", "warn-bg", "danger", "danger-bg"]),
    ("Category (brightened for dark)", ["heart", "activity", "sleep", "cardio"]),
]


def emit_dark_block(indent: int) -> str:
    pad = " " * indent
    out = []
    for i, (title, keys) in enumerate(CSS_DARK_GROUPS):
        if i > 0:
            out.append("")
        out.append(f"{pad}/* {title} */")
        if keys == "__shadows__":
            for k in SHADOW_KEYS:
                out.append(f"{pad}{shadow_varname(k)}: {shadow_value(k, 'dark')};")
        else:
            for k in keys:
                out.append(f"{pad}--{k}: {get(k, 'dark')};")
    return "\n".join(out)


def emit_dark_css() -> str:
    lines = [
        "/* dzarlax.dev Design System — Dark Theme */",
        "/* Generated from tokens/tokens.json by bin/gen-tokens.py — do not hand-edit. */",
        "",
        "/* Explicit dark mode (via HTML attribute) */",
        "[dark-mode] {",
        emit_dark_block(4),
        "}",
        "",
        "/* System preference fallback (respects OS dark mode when no explicit choice) */",
        "@media (prefers-color-scheme: dark) {",
        "    :root:not([light-mode]) {",
        emit_dark_block(8),
        "    }",
        "}",
    ]
    return "\n".join(lines) + "\n"


# ─────────────────────────────────────────────────────────────────────────────
# Swift — tokens/ios/DesignSystemColors.swift
# ─────────────────────────────────────────────────────────────────────────────

# (Swift name, JSON key, optional section header to emit before this entry)
SWIFT_ENTRIES = [
    ("dsBackground",        "bg",                 "Backgrounds"),
    ("dsSurface",           "surface",            None),
    ("dsSurface2",          "surface-2",          None),
    ("dsSurface3",          "surface-3",          None),

    ("dsText",              "text",               "Text"),
    ("dsTextSecondary",     "text-secondary",     None),
    ("dsTextTertiary",      "text-tertiary",      None),

    ("dsAccent",            "accent",             "Accent"),
    ("dsAccentHover",       "accent-hover",       None),
    ("dsAccentForeground",  "accent-foreground",  None),

    ("dsBorder",            "border",             "Borders"),
    ("dsBorderHover",       "border-hover",       None),

    ("dsGood",              "good",               "Status"),
    ("dsGoodBg",            "good-bg",            None),
    ("dsWarn",              "warn",               None),
    ("dsWarnBg",            "warn-bg",            None),
    ("dsDanger",            "danger",             None),
    ("dsDangerBg",          "danger-bg",          None),

    ("dsHeart",             "heart",              "Health categories"),
    ("dsActivity",          "activity",           None),
    ("dsSleep",             "sleep",              None),
    ("dsCardio",            "cardio",             None),
]

_RGBA = re.compile(
    r"rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9]*\.?[0-9]+)\s*\)"
)


def _fmt_alpha(a: str) -> str:
    """Strip trailing zeros from alpha, keep at least one digit after the dot."""
    f = float(a)
    s = f"{f:.4f}".rstrip("0").rstrip(".")
    return s if "." in s else f"{s}.0"


def _hex_rgb(h: str) -> tuple:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


# Maps (r, g, b) → hex-with-#, per mode. Used to preserve the
# "this rgba is just `<token>` with alpha" semantic in Swift output —
# e.g. dsTextSecondary light = `text` (#1A1A1E) at α=0.7.
def _build_rgb_map(mode: str) -> dict:
    out = {}
    for name, v in COLORS.items():
        if name == "brand":
            continue
        val = v.get(mode, "")
        if val.startswith("#"):
            out.setdefault(_hex_rgb(val), val)
    return out


_RGB_MAP_LIGHT = _build_rgb_map("light")
_RGB_MAP_DARK = _build_rgb_map("dark")


def swift_uicolor(value: str, mode: str) -> str:
    """Render a token value as a UIColor expression. `mode` is 'light' or 'dark'
    and is used to resolve rgba RGB → base hex token for `.withAlphaComponent`."""
    if value.startswith("#"):
        return f'UIColor(hex: "{value}")'
    # Tolerate both `rgba(a,b,c,d)` and `rgba(a, b, c, d)`.
    m = _RGBA.match(value)
    if not m:
        raise ValueError(f"Unrecognised color value: {value!r}")
    r, g, b, a = int(m[1]), int(m[2]), int(m[3]), _fmt_alpha(m[4])
    if (r, g, b) == (0, 0, 0):
        return f"UIColor.black.withAlphaComponent({a})"
    if (r, g, b) == (255, 255, 255):
        return f"UIColor.white.withAlphaComponent({a})"
    rgb_map = _RGB_MAP_LIGHT if mode == "light" else _RGB_MAP_DARK
    base = rgb_map.get((r, g, b))
    if base:
        return f'UIColor(hex: "{base}").withAlphaComponent({a})'
    return (f"UIColor(red: {r}/255, green: {g}/255, "
            f"blue: {b}/255, alpha: {a})")


def emit_swift_entry(swift_name: str, key: str) -> str:
    light = get(key, "light")
    dark = get(key, "dark")
    # Fast path: both pure hex → use the hex-pair convenience helper.
    if light.startswith("#") and dark.startswith("#"):
        return (f'    static let {swift_name} = '
                f'dsDynamic(lightHex: "{light}", darkHex: "{dark}")')
    return (f"    static let {swift_name} = dsDynamic(\n"
            f"        light: {swift_uicolor(light, 'light')},\n"
            f"        dark:  {swift_uicolor(dark, 'dark')}\n"
            f"    )")


SWIFT_HEADER = '''\
// dzarlax design system — iOS color tokens
//
// Generated from tokens/tokens.json by bin/gen-tokens.py — do not hand-edit.
// CSS mirrors live in tokens/colors.css + themes/dark.css.
//
// Drop this file into your Xcode target as-is. All `ds*` colors are dynamic
// (UITraitCollection-aware) — they switch automatically with iOS dark mode.

import SwiftUI
import UIKit

extension UIColor {
    convenience init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b, a: CGFloat
        if hex.count == 8 {
            r = CGFloat((int >> 24) & 0xFF) / 255
            g = CGFloat((int >> 16) & 0xFF) / 255
            b = CGFloat((int >> 8)  & 0xFF) / 255
            a = CGFloat( int        & 0xFF) / 255
        } else {
            r = CGFloat((int >> 16) & 0xFF) / 255
            g = CGFloat((int >> 8)  & 0xFF) / 255
            b = CGFloat( int        & 0xFF) / 255
            a = 1.0
        }
        self.init(red: r, green: g, blue: b, alpha: a)
    }
}

private func dsDynamic(light: UIColor, dark: UIColor) -> Color {
    Color(uiColor: UIColor { trait in
        trait.userInterfaceStyle == .dark ? dark : light
    })
}

private func dsDynamic(lightHex: String, darkHex: String) -> Color {
    dsDynamic(light: UIColor(hex: lightHex), dark: UIColor(hex: darkHex))
}

extension Color {
'''


def emit_swift() -> str:
    # SWIFT_HEADER already ends with `extension Color {\n`; the first entry
    # follows directly, subsequent section headers get a leading blank line.
    out = [SWIFT_HEADER.rstrip("\n")]
    for i, (name, key, header) in enumerate(SWIFT_ENTRIES):
        if header is not None:
            if i > 0:
                out.append("")
            out.append(f"    // {header}")
        out.append(emit_swift_entry(name, key))
    out.append("}")
    return "\n".join(out) + "\n"


# ─────────────────────────────────────────────────────────────────────────────
# Spacing & Typography CSS
# ─────────────────────────────────────────────────────────────────────────────

def emit_spacing_css() -> str:
    spacing = TOKENS["spacing"]
    radius = TOKENS["radius"]
    transition = TOKENS["transition"]
    nav_height = TOKENS["navbar-height"]
    container = TOKENS["container"]
    
    lines = [
        "/* dzarlax.dev Design System — Spacing & Radius Tokens */",
        "/* Generated from tokens/tokens.json by bin/gen-tokens.py — do not hand-edit. */",
        "/* Note: shadow tokens live in tokens/shadows.css (generated from tokens.json). */",
        "",
        ":root {"
    ]
    
    lines.append("    /* Border radius */")
    for k in ["xs", "sm", "default", "lg", "full"]:
        val = radius[k]
        varname = "--radius" if k == "default" else f"--radius-{k}"
        lines.append(f"    {varname}: {val};")
        
    lines.append("")
    lines.append("    /* Spacing scale */")
    for k in ["xs", "sm", "default", "lg", "xl"]:
        val = spacing[k]
        varname = "--spacing" if k == "default" else f"--spacing-{k}"
        lines.append(f"    {varname}: {val};")
        
    lines.append("")
    lines.append("    /* Transition */")
    lines.append(f"    --transition: {transition};")
    
    lines.append("")
    lines.append("    /* Navbar */")
    lines.append(f"    --navbar-height: {nav_height};")
    
    lines.append("")
    lines.append("    /* Container widths */")
    for k in ["sm", "md", "lg", "xl"]:
        val = container[k]
        lines.append(f"    --container-{k}: {val};")
        
    lines.append("}")
    return "\n".join(lines) + "\n"


def emit_typography_css() -> str:
    typo = TOKENS["typography"]
    sizes = typo["size"]
    leading = typo["leading"]
    tracking = typo["tracking"]
    
    lines = [
        "/* dzarlax.dev Design System — Typography Tokens */",
        "/* Generated from tokens/tokens.json by bin/gen-tokens.py — do not hand-edit. */",
        "",
        ":root {",
        f"    --font: {typo['font']};",
        f"    --font-serif: {typo['font-serif']};",
        f"    --font-mono: {typo['font-mono']};",
        ""
    ]
    
    for k in ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl"]:
        val = sizes[k]
        lines.append(f"    --text-{k}: {val};")
        
    lines.append("")
    for k in ["tight", "normal", "relaxed"]:
        val = leading[k]
        lines.append(f"    --leading-{k}: {val};")
        
    lines.append("")
    for k in ["tight", "normal", "wide", "caps"]:
        val = tracking[k]
        lines.append(f"    --tracking-{k}: {val};")
        
    lines.append("}")
    return "\n".join(lines) + "\n"


# ─────────────────────────────────────────────────────────────────────────────
# Driver
# ─────────────────────────────────────────────────────────────────────────────

OUTPUTS = [
    ("tokens/colors.css",                    emit_colors_css),
    ("tokens/shadows.css",                   emit_shadows_css),
    ("tokens/spacing.css",                   emit_spacing_css),
    ("tokens/typography.css",                emit_typography_css),
    ("themes/dark.css",                      emit_dark_css),
    ("tokens/ios/DesignSystemColors.swift",  emit_swift),
]


def main() -> int:
    check = "--check" in sys.argv
    changed = []
    for rel, fn in OUTPUTS:
        path = ROOT / rel
        new = fn()
        # Force UTF-8 on read AND write — on Windows the default text mode is
        # cp1252, which turns em-dashes into `?` and rewrites every file with
        # mojibake on each run. The mirrors carry comments with `—`, so this
        # is not optional.
        old = path.read_text(encoding="utf-8") if path.exists() else ""
        if new != old:
            changed.append(rel)
            if not check:
                path.write_text(new, encoding="utf-8", newline="\n")
    if check:
        if changed:
            print("Token mirrors out of sync with tokens.json:", file=sys.stderr)
            for c in changed:
                print(f"  - {c}", file=sys.stderr)
            print("Run: python3 bin/gen-tokens.py", file=sys.stderr)
            return 1
        print("Token mirrors up to date.")
        return 0
    if changed:
        for c in changed:
            print(f"Wrote {c}")
    else:
        print("Token mirrors already up to date.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
