# 2FA NODE

This library generates and verifies time-based one-time passwords (TOTP, RFC 6238) and HMAC-based one-time passwords (HOTP, RFC 4226) for two-factor authentication (2FA). It also creates the secret, the `otpauth://` URI and the QR code that authenticator apps such as Google Authenticator or Authy scan.

## Features

- **Generate a 2FA secret**: a random base32 secret, its `otpauth://` URI and a QR code of that URI.
- **Generate and verify TOTP tokens**: 6-digit codes that change every 30 seconds, optionally accepting each token only once.
- **Generate and verify HOTP tokens**: 6-digit codes tied to a counter.

## Installation

```bash
npm install 2fa-node
```

Requires Node.js 20.19 or later.

## Usage

### Generate a TOTP secret

```typescript
import { generateSecret } from "2fa-node";

const { secret, uri, qr } = await generateSecret({
  name: "MyApp", // issuer shown in the authenticator app
  account: "user@example.com", // account shown in the authenticator app
});

console.log(secret); // store it for the user
console.log(uri); // otpauth://totp/MyApp:user%40example.com?secret=...&issuer=MyApp
console.log(qr); // PNG data URL to show to the user
```

### Generate an HOTP secret

```typescript
import { generateSecret } from "2fa-node";

const { secret, uri, qr } = await generateSecret(
  { name: "MyApp", account: "user@example.com", counter: 0 },
  "HOTP",
);
```

### Verify a TOTP token

```typescript
import { verifyToken } from "2fa-node";

const secret = "JBSWY3DPEHPK3PXP"; // the user's stored secret
const token = "123456"; // the token typed by the user

const isValid = verifyToken(secret, token);

console.log(isValid); // true if valid, false otherwise
```

### Accept each TOTP token only once

```typescript
import { verifyTokenOnce } from "2fa-node";

const secret = "JBSWY3DPEHPK3PXP"; // the user's stored secret
const token = "123456"; // the token typed by the user
const lastTimeStep = null; // the user's stored time step, null before the first login

const match = verifyTokenOnce(secret, token, lastTimeStep);

if (match) {
  // Save match.timeStep as the user's lastTimeStep, so this token cannot be used again.
}
```

### Generate a TOTP token

```typescript
import { generateToken } from "2fa-node";

const secret = "JBSWY3DPEHPK3PXP";
const result = generateToken(secret);

console.log(result?.token); // the current token, or undefined if the secret is invalid
```

### Verify an HOTP token

```typescript
import { verifyHOTPToken } from "2fa-node";

const secret = "JBSWY3DPEHPK3PXP"; // the user's stored secret
const token = "123456"; // the token typed by the user
const counter = 1; // the user's stored counter

const isValid = verifyHOTPToken(secret, token, counter);

if (isValid) {
  // Save counter + 1 so this token cannot be used again.
}
```

### Generate an HOTP token

```typescript
import { generateHOTPToken } from "2fa-node";

const secret = "JBSWY3DPEHPK3PXP";
const counter = 1;

const result = generateHOTPToken(secret, counter);

console.log(result?.token); // the token, or undefined if the secret is invalid
```

## API Documentation

Tokens have 6 digits and use HMAC-SHA1; TOTP tokens change every 30 seconds. Secrets are case-insensitive base32 strings of at least 80 bits (16 characters).

### `generateSecret(options: SecretOptions, type: OtpType = "TOTP"): Promise<{ secret: string; uri: string; qr: string }>`

Generates a random secret for two-factor authentication.

- **Parameters**:
  - `options.name`: issuer shown in the authenticator app, usually your product name.
  - `options.account`: account shown in the authenticator app, usually the user's email.
  - `options.counter` (optional): initial HOTP counter written to the URI. Defaults to `0`; ignored for TOTP.
  - `options.numberOfSecretBytes` (optional): size of the secret in bytes. Defaults to `20`; must be an integer of at least `16`, because RFC 4226 requires 128-bit secrets.
  - `type`: `"TOTP"` (default) or `"HOTP"`.
- **Returns**: a Promise resolving to:
  - `secret`: the base32 secret to store for the user.
  - `uri`: the `otpauth://` URI.
  - `qr`: a PNG data URL of the URI's QR code.
- **Throws**: `TypeError` for an unknown `type`; `RangeError` for an invalid `numberOfSecretBytes` or HOTP `counter`.

### `generateToken(secret: string): { token: string } | null`

Generates the current TOTP token.

- **Returns**: `{ token }`, or `null` if the secret is invalid.

### `verifyToken(secret: string, token?: string, window: number | [number, number] = 1): boolean`

Verifies a TOTP token.

- **Parameters**:
  - `window`: how many 30-second steps before and after now are also accepted. Use `[past, future]` for different values; `0` accepts only the current step.
- **Returns**: `true` if the token is valid; `false` otherwise, including when the token is missing or malformed or the secret is invalid.
- **Throws**: `RangeError` if `window` is not made of non-negative integers or spans more than 98 steps in total.

### `verifyTokenOnce(secret: string, token?: string, lastTimeStep?: number | null, window: number | [number, number] = 1): { timeStep: number } | null`

Verifies a TOTP token like `verifyToken`, but also rejects tokens from `lastTimeStep` or earlier, so each token is accepted only once.

- **Parameters**:
  - `lastTimeStep`: the `timeStep` returned by the user's last successful check, or `null`/`undefined` if there is none.
  - `window`: same as in `verifyToken`.
- **Returns**: `{ timeStep }` with the 30-second step the token belongs to, or `null` if the token is rejected. Save `timeStep` for the user after each success.
- **Throws**: the same errors as `verifyToken`, plus a `RangeError` if `lastTimeStep` is not a non-negative safe integer.

### `generateHOTPToken(secret: string, counter: number = 0): { token: string } | null`

Generates the HOTP token for a counter.

- **Returns**: `{ token }`, or `null` if the secret is invalid.
- **Throws**: `RangeError` if `counter` is not a non-negative safe integer.

### `verifyHOTPToken(secret: string, token: string | undefined, counter: number): boolean`

Verifies an HOTP token against exactly the given counter.

- **Returns**: `true` if the token is valid; `false` otherwise, including when the token is missing or malformed or the secret is invalid.
- **Throws**: `RangeError` if `counter` is not a non-negative safe integer.

### Types

`SecretOptions` and `OtpType` (`"TOTP" | "HOTP"`) are exported for TypeScript users.

## Security notes

- `verifyToken` accepts the same token again while it is inside the window. To block replays, use `verifyTokenOnce`, including for the check that confirms enrollment, and save the returned `timeStep` only if it moves forward. Do it in a single statement and treat zero updated rows as a failed login, so two simultaneous requests with the same token cannot both succeed:

  ```sql
  UPDATE users SET last_time_step = $step
  WHERE id = $id AND (last_time_step IS NULL OR last_time_step < $step);
  ```

  For HOTP, advance the counter the same way: `UPDATE users SET counter = counter + 1 WHERE id = $id AND counter = $counter`.

- Limit how many verification attempts a user can make.
- Keep secrets encrypted at rest.

## Upgrading from 0.x

- HOTP tokens now follow RFC 4226 and match authenticator apps, so they differ from the tokens 0.x produced.
- `verifyToken` and `verifyHOTPToken` return `false` instead of `null` when the token is missing.
- `verifyToken` accepts one step (30 seconds) before and after now by default, instead of four.
- `verifyHOTPToken` requires the counter and no longer takes a `window` argument, which never had any effect.
- Secrets must be canonical base32 of at least 80 bits. Secrets that 0.x accepted, such as ones with spaces, extra `=` padding or non-zero unused trailing bits, now make the generate functions return `null` and the verify functions return `false`.
- `numberOfSecretBytes` must be at least `16`. Invalid types, counters and windows throw.
- The URI carries the standard `issuer` parameter instead of `name`.
- Only the package entry point can be imported: deep imports such as `2fa-node/dist/secret.js` no longer work.
- Node.js 20.19 or later is required.
- The license changed from MIT to MPL-2.0.

## Dependencies

- [otplib](https://www.npmjs.com/package/otplib) - A library for generating and verifying one-time passwords.
- [qrcode](https://www.npmjs.com/package/qrcode) - A library for generating QR codes.

## License

This project is licensed under the Mozilla Public License 2.0 - see the [LICENSE.md](LICENSE.md) file for details.
