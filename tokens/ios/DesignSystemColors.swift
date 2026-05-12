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
    // Backgrounds
    static let dsBackground = dsDynamic(lightHex: "#FCFAF7", darkHex: "#1A1D21")
    static let dsSurface = dsDynamic(lightHex: "#FFFFFF", darkHex: "#22252A")
    static let dsSurface2 = dsDynamic(lightHex: "#E8E6E3", darkHex: "#2A2D32")
    static let dsSurface3 = dsDynamic(lightHex: "#DCDAD7", darkHex: "#33363B")

    // Text
    static let dsText = dsDynamic(lightHex: "#1A1A1E", darkHex: "#F5F5F5")
    static let dsTextSecondary = dsDynamic(
        light: UIColor(hex: "#1A1A1E").withAlphaComponent(0.7),
        dark:  UIColor(hex: "#F5F5F5").withAlphaComponent(0.7)
    )
    static let dsTextTertiary = dsDynamic(
        light: UIColor(hex: "#1A1A1E").withAlphaComponent(0.5),
        dark:  UIColor(hex: "#F5F5F5").withAlphaComponent(0.5)
    )

    // Accent
    static let dsAccent = dsDynamic(lightHex: "#18181B", darkHex: "#F5F5F5")
    static let dsAccentHover = dsDynamic(lightHex: "#25282D", darkHex: "#E0E0E0")
    static let dsAccentForeground = dsDynamic(lightHex: "#FFFFFF", darkHex: "#1A1A1E")

    // Borders
    static let dsBorder = dsDynamic(
        light: UIColor.black.withAlphaComponent(0.08),
        dark:  UIColor.white.withAlphaComponent(0.08)
    )
    static let dsBorderHover = dsDynamic(
        light: UIColor.black.withAlphaComponent(0.12),
        dark:  UIColor.white.withAlphaComponent(0.12)
    )

    // Status
    static let dsGood = dsDynamic(lightHex: "#16a34a", darkHex: "#22c55e")
    static let dsGoodBg = dsDynamic(
        light: UIColor(hex: "#f0fdf4"),
        dark:  UIColor(red: 22/255, green: 163/255, blue: 74/255, alpha: 0.15)
    )
    static let dsWarn = dsDynamic(lightHex: "#d97706", darkHex: "#f59e0b")
    static let dsWarnBg = dsDynamic(
        light: UIColor(hex: "#fffbeb"),
        dark:  UIColor(red: 217/255, green: 119/255, blue: 6/255, alpha: 0.15)
    )
    static let dsDanger = dsDynamic(lightHex: "#dc2626", darkHex: "#ef4444")
    static let dsDangerBg = dsDynamic(
        light: UIColor(hex: "#fef2f2"),
        dark:  UIColor(red: 220/255, green: 38/255, blue: 38/255, alpha: 0.15)
    )

    // Health categories
    static let dsHeart = dsDynamic(lightHex: "#e11d48", darkHex: "#fb7185")
    static let dsActivity = dsDynamic(lightHex: "#059669", darkHex: "#34d399")
    static let dsSleep = dsDynamic(lightHex: "#7c3aed", darkHex: "#a78bfa")
    static let dsCardio = dsDynamic(lightHex: "#0284c7", darkHex: "#38bdf8")
}
