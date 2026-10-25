/**
 * Chooses black or white text for contrast against a primary color.
 *
 * @param primaryColor - The primary color in #RGB or #RRGGBB format.
 * @returns The contrasting foreground color.
 */
export function getPrimaryForeground(primaryColor: string) {
  const hex =
    primaryColor.length === 4
      ? primaryColor
          .slice(1)
          .split("")
          .map((digit) => digit.repeat(2))
          .join("")
      : primaryColor.slice(1);

  const [red, green, blue] = [0, 2, 4].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

  return (luminance + 0.05) / 0.05 > 1.05 / (luminance + 0.05)
    ? "#000000"
    : "#ffffff";
}
