import { test } from "@japa/runner";
import { generateHOTPToken, verifyHOTPToken } from "../lib/hotp.js";
import { generateSecret } from "../lib/secret.js";

const { secret } = await generateSecret({
  name: "App",
  account: "exemple@exemple.com",
  counter: 0,
  numberOfSecretBytes: 20
});

const counter = 0;

const token = generateHOTPToken(secret, counter);

test("Generates a valid secret without options", ({ expect }) => {
  expect(typeof secret).toEqual("string");
});

test("Generates a valid token", ({ expect }) => {
  expect(typeof token?.token).toBe("string");
});

test("Check an valid token", ({ expect }) => {
  const verification = verifyHOTPToken(secret, token?.token, counter);
  expect(verification).toEqual(true);
});

test("Check an invalid token", ({ expect }) => {
  const verification = verifyHOTPToken(secret, "111111", counter);
  expect(verification).toEqual(false);
});

test("Check an invalid token by a different counter", ({ expect }) => {
  const verification = verifyHOTPToken(secret, token?.token, 2);
  expect(verification).toEqual(false);
});
