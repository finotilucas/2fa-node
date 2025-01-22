import QRCode from "qrcode";
import { authenticator } from "otplib";
import { Payload } from "./interfaces.js";
import type { Strategy } from "./types.js";

/**
 * Generates a secret key for two-factor authentication (TOTP or HOTP), along with a URI and a QR code for easy integration with an authenticator app.
 *
 * @param {Payload} Payload - The Payload for generating the secret key.
 * @param {string} payload.name - The name of the application or service (displayed in the authenticator app).
 * @param {string} payload.account - The account identifier (e.g., email or username) associated with the user.
 * @param {number} [payload.counter] - The counter value, required only for HOTP. Defaults to `0` if not provided and the type is "HOTP".
 * @param {number} [payload.numberOfSecretBytes] - Number of authenticator secret bytes default is 20.
 * @param {Strategy} [strategy="TOTP"] - The type of OTP to generate. Defaults to "TOTP" (Time-based OTP). Use "HOTP" for counter-based OTP.
 *
 * @returns {Promise<{ secret: string, uri: string, qr: string }>} - A Promise that resolves to an object containing:
 *    - `secret` (string): The generated secret key for OTP.
 *    - `uri` (string): The otpauth URI containing the secret and configuration details.
 *    - `qr` (string): A Data URL representing the QR code that can be scanned by an authenticator app.
 *
 * @example
 * // Generating a time-based (TOTP) secret:
 * const payload = { name: 'MyApp', account: 'user@example.com' };
 *
 * const secret = await generateSecret(payload)
 * console.log(secret.secret); // The generated secret key
 * console.log(secret.uri);    // The otpauth URI for HOTP
 * console.log(secret.qr);     // The Data URL for the QR code
 *
 * @example
 * // Generating a counter-based (HOTP) secret:
 * const payload = { name: 'MyApp', account: 'user@example.com', counter: 1 };
 *
 * const secret = await generateSecret(payload, "HOTP")
 * console.log(secret.secret); // The generated secret key
 * console.log(secret.uri);    // The otpauth URI for HOTP
 * console.log(secret.qr);     // The Data URL for the QR code
 */

export async function generateSecret(
  payload: Payload,
  strategy: Strategy = "TOTP",
): Promise<{
  secret: string;
  uri: string;
  qr: string;
}> {
  const config = {
    name: encodeURIComponent(payload?.name ?? "App"),
    account: payload.account ? encodeURIComponent(`:${payload.account}`) : "",
    counter: strategy === "HOTP" ? (payload.counter ?? 0).toString() : undefined,
    numberOfBytes: payload.numberOfSecretBytes ?? 20
  } as const;

  const secret = authenticator.generateSecret(config.numberOfBytes);

  const uri =
    strategy === "TOTP"
      ? new URL(`otpauth://totp/${config.name}${config.account}`)
      : new URL(`otpauth://hotp/${config.name}${config.account}`);

  const params: Record<string, string> = {
    secret,
    name: config.name,
  };

  if (strategy === "HOTP" && config.counter) {
    params.counter = config.counter;
  }

  uri.search = new URLSearchParams(params).toString();

  return {
    secret,
    uri: uri.href,
    qr: await QRCode.toDataURL(uri.href),
  };
}
