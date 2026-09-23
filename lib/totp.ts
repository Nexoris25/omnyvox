import {
  createHmac,
  randomBytes,
  timingSafeEqual,
  createHash,
} from "node:crypto";
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function base32(bytes: Buffer) {
  let bits = 0,
    value = 0,
    result = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += alphabet[(value >>> (bits -= 5)) & 31];
    }
  }
  if (bits) result += alphabet[(value << (5 - bits)) & 31];
  return result;
}
function decode(value: string) {
  let bits = 0,
    number = 0;
  const out: number[] = [];
  for (const c of value) {
    const n = alphabet.indexOf(c);
    if (n < 0) throw Error("Invalid secret");
    number = (number << 5) | n;
    bits += 5;
    if (bits >= 8) out.push((number >>> (bits -= 8)) & 255);
  }
  return Buffer.from(out);
}
export const newTotpSecret = () => base32(randomBytes(20));
export function totp(secret: string, counter: number, digits = 6) {
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64BE(BigInt(counter));
  const mac = createHmac("sha1", decode(secret)).update(bytes).digest();
  const offset = mac[mac.length - 1] & 15;
  return String(
    (mac.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits,
  ).padStart(digits, "0");
}
export function verifyTotp(
  secret: string,
  code: string,
  lastCounter = -1,
  now = Date.now(),
) {
  if (!/^\d{6}$/.test(code)) return null;
  const step = Math.floor(now / 30000);
  for (const counter of [step, step - 1, step + 1])
    if (
      counter > lastCounter &&
      counter >= 0 &&
      timingSafeEqual(Buffer.from(totp(secret, counter)), Buffer.from(code))
    )
      return counter;
  return null;
}
export const recoveryHash = (code: string) =>
  createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
export const recoveryCodes = () =>
  Array.from({ length: 10 }, () =>
    randomBytes(8).toString("hex").toUpperCase(),
  );
