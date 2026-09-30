import { generateSync, verifySync } from "otplib";
import { assertValidCounter, decodeSecret, guardrails } from "./secret.js";

/** Returns the HOTP token for a counter, or null if the secret is invalid. */
export function generateHOTPToken(
  secret: string,
  counter: number = 0,
): { token: string } | null {
  assertValidCounter(counter);

  const key = decodeSecret(secret);
  if (!key) return null;

  const token = generateSync({
    strategy: "hotp",
    secret: key,
    counter,
    guardrails,
  });
  return { token };
}

/** Checks an HOTP token against exactly the given counter. */
export function verifyHOTPToken(
  secret: string,
  token: string | undefined,
  counter: number,
): boolean {
  assertValidCounter(counter);

  const key = decodeSecret(secret);
  if (!key || typeof token !== "string" || !/^\d{6}$/.test(token)) return false;

  return verifySync({
    strategy: "hotp",
    secret: key,
    token,
    counter,
    counterTolerance: 0,
    guardrails,
  }).valid;
}
