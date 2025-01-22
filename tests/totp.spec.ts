import { test } from "@japa/runner";
import { generateToken, verifyToken } from "../lib/totp.js";
import { generateSecret } from "../lib/secret.js";

const { secret } = await generateSecret(
  {
    name: "App",
    account: "exemple@exemple.com",
    counter: 0,
    numberOfSecretBytes: 20,
  },
  "HOTP",
);

const token = generateToken(secret);

test("Generates a valid secret without options", ({ expect }) => {
  expect(typeof secret).toEqual("string");
});

test("Generates a valid token", ({ expect }) => {
  expect(typeof token?.token).toBe("string");
});

test("Check an valid token", ({ expect }) => {
  const verification = verifyToken(secret, token?.token);
  expect(verification).toEqual(true);
});

test("Check an invalid token", ({ expect }) => {
  const verification = verifyToken(secret, "111111");
  expect(verification).toEqual(false);
});
