# 2FA NODE

This library provides a set of utilities to generate and verify time-based one-time passwords (TOTP) and HMAC-based one-time passwords (HOTP), allowing easy integration of two-factor authentication (2FA) in applications. It also supports generating QR codes for easy scanning with authenticator apps like Google Authenticator or Authy.

## Features

- **Generate Secret for 2FA**: Generates a secret key, a URI, and a QR code that can be used for integrating two-factor authentication with authenticator apps.
- **Generate TOTP Token**: Generates a time-based one-time password (TOTP) using a secret key.
- **Verify TOTP Token**: Verifies the validity of a TOTP token.
- **Generate HOTP Token**: Generates a HMAC-based one-time password (HOTP) using a secret key and a counter.
- **Verify HOTP Token**: Verifies the validity of a HOTP token using a secret key and a counter.

## Installation

To install this library, run the following command:

```bash
npm install 2fa-node
```

## Usage

### Generate 2FA Secret

This function generates a secret key, a URI, and a QR code for 2FA integration. It returns a promise that resolves to an object containing the secret, URI, and the QR code as a data URL.

### Generate TOTP Secret

```typescript
import { generateSecret } from "2fa-node";

const payload = {
  name: "MyApp", // Application name
  account: "user@example.com", // User account (email or username)
  numberOfSecretBytes: 20 // OPTIONAL
};

const secret = await generateSecret(payload);

console.log(secret);
```

### Generate HOTP Secret

```typescript
import { generateSecret } from "2fa-node";

const options = {
  name: "MyApp", // Application name
  account: "user@example.com", // User account (email or username)
  counter: 0, // ONLY WITH HOTP
};

const secret = await generateSecret(option, "HOTP");

console.log(secret);
```

### Generate TOTP Token

This function generates a time-based one-time password (TOTP) using the provided secret key.

```typescript
import { generateToken } from "2fa-node";

const secret = "JBSWY3DPEHPK3PXP"; // Your pre-generated secret
const result = generateToken(secret);

console.log(result.token); // The generated TOTP token
```

### Verify TOTP Token

This function verifies if a provided TOTP token is valid for the given secret key.

```typescript
import { verifyToken } from "2fa-node";

const secret = "JBSWY3DPEHPK3PXP"; // The secret key used for verification
const token = "123456"; // The token to verify

const isValid = verifyToken(secret, token);

console.log(isValid); // true if valid, false if invalid
```

### Generate HOTP Token

This function generates a HMAC-based one-time password (HOTP) token based on the provided secret key and counter value.

```typescript
import { generateHOTPToken } from "2fa-node";

const secret = "JBSWY3DPEHPK3PXP"; // Your pre-generated secret
const counter = 1; // Optional counter (defaults to 0)

const result = generateHOTPToken(secret, counter);

console.log(result.token); // The generated HOTP token
```

### Verify HOTP Token

This function verifies if a provided HOTP token is valid for the given secret key and counter value.

```typescript
import { verifyHOTPToken } from "2fa-node";

const secret = "JBSWY3DPEHPK3PXP"; // The secret key used for verification
const token = "123456"; // The token to verify
const counter = 1; // The counter associated with the token

const isValid = verifyHOTPToken(secret, token, counter);

console.log(isValid); // true if valid, false if invalid
```

## API Documentation

### `generateSecret(options: Options): Promise<{ secret: string, uri: string, qr: string }>`

Generates a secret key, URI, and QR code for 2FA integration.

- **Parameters**:
  - `options`: An object with the following properties:
    - `name`: The name of the application or service.
    - `account`: The account identifier (e.g., email or username).
- **Returns**: A Promise resolving to an object with:
  - `secret`: The generated secret key.
  - `uri`: The otpauth URI.
  - `qr`: The Data URL for the QR code.

### `generateToken(secret: string): { token: string } | null`

Generates a TOTP token.

- **Parameters**:
  - `secret`: The secret key used for generating the TOTP token.
- **Returns**: An object containing the generated token, or `null` if the secret is invalid or missing.

### `verifyToken(secret: string, token?: string): boolean | null`

Verifies the validity of a TOTP token.

- **Parameters**:
  - `secret`: The secret key used for verification.
  - `token`: The TOTP token to verify.
- **Returns**: `true` if the token is valid, `false` if it's invalid, or `null` if the token is missing.

### `generateHOTPToken(secret: string, counter: number = 0): { token: string } | null`

Generates an HOTP token.

- **Parameters**:
  - `secret`: The secret key used for generating the HOTP token.
  - `counter`: The counter value used to generate the HOTP token (defaults to 0).
- **Returns**: An object containing the generated token, or `null` if the secret is invalid or missing.

### `verifyHOTPToken(secret: string, token?: string, counter: number = 0): boolean | null`

Verifies the validity of an HOTP token.

- **Parameters**:
  - `secret`: The secret key used for verification.
  - `token`: The HOTP token to verify.
  - `counter`: The counter value associated with the HOTP token.
- **Returns**: `true` if the token is valid, `false` if it's invalid, or `null` if the token is missing.

## Dependencies

- [otplib](https://www.npmjs.com/package/otplib) - A library for generating and verifying one-time passwords.
- [qrcode](https://www.npmjs.com/package/qrcode) - A library for generating QR codes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
