export const palettes = [
  {
    id: "violet",
    name: "Omnyvox violet",
    primary: "#540CDA",
    background: "#FFFFFF",
    text: "#172033",
    secondary: "#EDE7FB",
  },
  {
    id: "forest",
    name: "Forest & cream",
    primary: "#165447",
    background: "#FAF9F3",
    text: "#18322B",
    secondary: "#DFEADD",
  },
  {
    id: "navy",
    name: "Navy & ice",
    primary: "#17385D",
    background: "#F6F9FC",
    text: "#182536",
    secondary: "#E0EAF4",
  },
  {
    id: "terracotta",
    name: "Clay & linen",
    primary: "#963E2D",
    background: "#FFFAF6",
    text: "#35271F",
    secondary: "#F0DFD1",
  },
] as const;
export function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/../g)!
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
export function contrast(a: string, b: string) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export function foreground(primary: string) {
  return contrast(primary, "#FFFFFF") >= contrast(primary, "#000000")
    ? "#FFFFFF"
    : "#000000";
}
