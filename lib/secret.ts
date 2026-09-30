import {
  createGuardrails,
  generateSecret as generateRandomSecret,
  generateURI,
  ScureBase32Plugin,
} from "otplib";
import QRCode from "qrcode";

export type OtpType = "TOTP" | "HOTP";

export interface SecretOptions {
  name: string;
  account: string;
  counter?: number | undefined;
  numberOfSecretBytes?: number | undefined;
}

const DEFAULT_SECRET_BYTES = 20;
const MIN_GENERATED_SECRET_BYTES = 16;
const MIN_ACCEPTED_SECRET_BYTES = 10;

const base32 = new ScureBase32Plugin();

export const guardrails = createGuardrails({
  MIN_SECRET_BYTES: MIN_ACCEPTED_SECRET_BYTES,
  MAX_SECRET_BYTES: Number.MAX_SAFE_INTEGER,
});

export function decodeSecret(secret: string): Uint8Array | null {
  try {
    const key = base32.decode(secret);
    return key.length >= MIN_ACCEPTED_SECRET_BYTES ? key : null;
  } catch {
    return null;
  }
}

export function assertValidCounter(counter: number): void {
  if (!Number.isSafeInteger(counter) || counter < 0) {
    throw new RangeError("counter must be a non-negative safe integer");
  }
}

/** Generates a random base32 secret with its otpauth:// URI and a QR code of that URI. */
export async function generateSecret(
  options: SecretOptions,
  type: OtpType = "TOTP",
): Promise<{ secret: string; uri: string; qr: string }> {
  if (type !== "TOTP" && type !== "HOTP") {
    throw new TypeError('type must be "TOTP" or "HOTP"');
  }

  const numberOfBytes = options.numberOfSecretBytes ?? DEFAULT_SECRET_BYTES;
  if (
    !Number.isInteger(numberOfBytes) ||
    numberOfBytes < MIN_GENERATED_SECRET_BYTES
  ) {
    throw new RangeError(
      `numberOfSecretBytes must be an integer of at least ${MIN_GENERATED_SECRET_BYTES}`,
    );
  }

  const counter = options.counter ?? 0;
  if (type === "HOTP") {
    assertValidCounter(counter);
  }

  const secret = generateRandomSecret({ length: numberOfBytes });
  const uri = generateURI({
    strategy: type === "HOTP" ? "hotp" : "totp",
    issuer: options.name,
    label: options.account,
    secret,
    counter,
  });

  const qr = await QRCode.toDataURL(uri);
  return { secret, uri, qr };
}
