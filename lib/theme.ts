// lib/theme.ts
import MaterialYou from "react-native-material-you-colors";
import type { MaterialYouPalette } from "react-native-material-you-colors";

/**
 * Build a Material You token set using ONLY system palettes:
 * - primary  : accent1
 * - secondary: accent2
 * - tertiary : accent3
 * - error    : error (if missing in platform/lib, we fallback to accent3)
 * - neutral  : surfaces/background/outline/etc from neutral1/neutral2
 */
function generateTheme(p: MaterialYouPalette) {
  const on = (hex: string) => {
    const c = hex.replace("#", "");
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    const y = (r * 299 + g * 587 + b * 114) / 1000;
    return y >= 128 ? "#0a0a0a" : "#ffffff";
  };

  // Some builds may not expose system_error; keep a strict Material You fallback to accent3.
  const pickError = (idx: number) =>
    (p as any).system_error?.[idx] ?? p.system_accent3[idx];

  // Indices roughly align with MD3 tone steps (60–70 for light, 40 for dark)
  const light = {
    isDark: false,

    primary: p.system_accent1[7],
    onPrimary: on(p.system_accent1[7]),

    secondary: p.system_accent2[7],
    onSecondary: on(p.system_accent2[7]),

    tertiary: p.system_accent3[7],
    onTertiary: on(p.system_accent3[7]),

    error: pickError(7),
    onError: on(pickError(7)),

    background: p.system_neutral1[1],
    onBackground: p.system_neutral1[11],

    surface: p.system_neutral1[2],
    onSurface: p.system_neutral1[11],

    // A slightly different neutral for cards/containers
    surfaceVariant: p.system_neutral2[3],
    onSurfaceVariant: p.system_neutral2[11],

    divider: p.system_neutral1[4],
    outline: p.system_neutral2[6],

    inputBg: p.system_neutral1[2],
    inputBorder: p.system_neutral1[4],

    muted: p.system_neutral2[5],
  };

  const dark: typeof light = {
    isDark: true,

    primary: p.system_accent1[4],
    onPrimary: on(p.system_accent1[4]),

    secondary: p.system_accent2[4],
    onSecondary: on(p.system_accent2[4]),

    tertiary: p.system_accent3[4],
    onTertiary: on(p.system_accent3[4]),

    error: pickError(4),
    onError: on(pickError(4)),

    background: p.system_neutral1[11],
    onBackground: p.system_neutral1[1],

    surface: p.system_neutral1[10],
    onSurface: p.system_neutral1[1],

    surfaceVariant: p.system_neutral2[9],
    onSurfaceVariant: p.system_neutral2[1],

    divider: p.system_neutral1[8],
    outline: p.system_neutral2[6],

    inputBg: p.system_neutral1[10],
    inputBorder: p.system_neutral1[8],

    muted: p.system_neutral2[6],
  };

  return { light, dark };
}

export const { ThemeProvider, useMaterialYouTheme } =
  MaterialYou.createThemeContext(generateTheme);

export const defaultThemeProviderProps = {
  colorScheme: "auto" as const,
  // seed for platforms without dynamic color (e.g., iOS < 15 / Android < 12)
  fallbackColor: "#3b82f6",
  generationStyle: "TONAL_SPOT" as const,
};
