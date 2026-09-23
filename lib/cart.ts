/** Only IDs/quantities are persisted; prices and customer details never are. */
export function readCart(raw: string | null): Record<string, number> {
  try {
    const value = JSON.parse(raw || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([id, quantity]) =>
            /^[a-f0-9-]{36}$/i.test(id) &&
            Number.isInteger(quantity) &&
            Number(quantity) > 0 &&
            Number(quantity) <= 50,
        )
        .slice(0, 50),
    ) as Record<string, number>;
  } catch {
    return {};
  }
}
