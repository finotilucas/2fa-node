import { generateSync, verifySync } from "otplib";
import { decodeSecret, guardrails } from "./secret.js";

const STEP_SECONDS = 30;
const MAX_WINDOW_STEPS = 98;

/** Returns the current TOTP token, or null if the secret is invalid. */
export function generateToken(secret: string): { token: string } | null {
  const key = decodeSecret(secret);
  if (!key) return null;

  const token = generateSync({ secret: key, guardrails });
  return { token };
}

/** Checks a TOTP token, also accepting `window` 30-second steps before and after now. */
export function verifyToken(
  secret: string,
  token?: string,
  window: number | [number, number] = 1,
): boolean {
  return verifyTokenOnce(secret, token, null, window) !== null;
}

/** Checks a TOTP token newer than `lastTimeStep` and returns the time step it matched, or null. */
export function verifyTokenOnce(
  secret: string,
  token?: string,
  lastTimeStep?: number | null,
  window: number | [number, number] = 1,
): { timeStep: number } | null {
  const [past, future] = typeof window === "number" ? [window, window] : window;
  if (
    !Number.isInteger(past) ||
    !Number.isInteger(future) ||
    past < 0 ||
    future < 0 ||
    past + future > MAX_WINDOW_STEPS
  ) {
    throw new RangeError(
      `window must be a non-negative integer or [past, future] pair spanning at most ${MAX_WINDOW_STEPS} steps`,
    );
  }

  const afterTimeStep = lastTimeStep ?? undefined;
  if (
    afterTimeStep !== undefined &&
    (!Number.isSafeInteger(afterTimeStep) || afterTimeStep < 0)
  ) {
    throw new RangeError("lastTimeStep must be a non-negative safe integer");
  }

  const key = decodeSecret(secret);
  if (!key || typeof token !== "string" || !/^\d{6}$/.test(token)) return null;

  const epoch = Math.floor(Date.now() / 1000);
  const currentStep = Math.floor(epoch / STEP_SECONDS);
  if (afterTimeStep !== undefined && afterTimeStep >= currentStep + future) {
    return null;
  }

  const result = verifySync({
    strategy: "totp",
    secret: key,
    token,
    epoch,
    t0: 0,
    period: STEP_SECONDS,
    epochTolerance: [past * STEP_SECONDS, future * STEP_SECONDS],
    afterTimeStep,
    guardrails,
  });
  return result.valid ? { timeStep: currentStep + result.delta } : null;
}
