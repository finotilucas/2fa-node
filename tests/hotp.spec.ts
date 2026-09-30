import { test } from "@japa/runner";
import { generateHOTPToken, verifyHOTPToken } from "../lib/index.js";

const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
const RFC_4226_TOKENS = [
  "755224",
  "287082",
  "359152",
  "969429",
  "338314",
  "254676",
  "287922",
  "162583",
  "399871",
  "520489",
];

test("generates the RFC 4226 test vectors", ({ expect }) => {
  RFC_4226_TOKENS.forEach((token, counter) => {
    expect(generateHOTPToken(RFC_SECRET, counter)).toEqual({ token });
  });
});

test("generates with counter 0 by default", ({ expect }) => {
  expect(generateHOTPToken(RFC_SECRET)).toEqual({ token: "755224" });
});

test("accepts lowercase and 80-bit secrets", ({ expect }) => {
  expect(generateHOTPToken(RFC_SECRET.toLowerCase(), 0)).toEqual({
    token: "755224",
  });
  expect(generateHOTPToken("JBSWY3DPEHPK3PXP", 0)).not.toBeNull();
});

test("verifies a token only at its own counter", ({ expect }) => {
  expect(verifyHOTPToken(RFC_SECRET, "287082", 1)).toBe(true);
  expect(verifyHOTPToken(RFC_SECRET, "287082", 0)).toBe(false);
  expect(verifyHOTPToken(RFC_SECRET, "287082", 2)).toBe(false);
});

test("rejects invalid secrets", ({ expect }) => {
  const invalidSecrets = [
    "",
    "   ",
    "1",
    "JBSW Y3DP EHPK 3PXP",
    "GEZDGNBVGY3TQOI",
  ];
  for (const secret of invalidSecrets) {
    expect(generateHOTPToken(secret, 0)).toBeNull();
    expect(verifyHOTPToken(secret, "755224", 0)).toBe(false);
  }
});

test("rejects missing or malformed tokens", ({ expect }) => {
  const invalidTokens = [
    undefined,
    "",
    "75522",
    "7552240",
    "abcdef",
    " 755224",
  ];
  for (const token of invalidTokens) {
    expect(verifyHOTPToken(RFC_SECRET, token, 0)).toBe(false);
  }
});

test("throws on invalid counters", ({ expect }) => {
  const invalidCounters = [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1];
  for (const counter of invalidCounters) {
    expect(() => generateHOTPToken(RFC_SECRET, counter)).toThrow(RangeError);
    expect(() => verifyHOTPToken(RFC_SECRET, "755224", counter)).toThrow(
      RangeError,
    );
  }
});

test("ignores options added to Object.prototype", ({ expect }) => {
  const prototype = Object.prototype as Record<string, unknown>;
  let result: boolean | null = null;
  prototype.counterTolerance = [5, 0];
  try {
    result = verifyHOTPToken(RFC_SECRET, "287082", 3);
  } finally {
    delete prototype.counterTolerance;
  }
  expect(result).toBe(false);
});

test("requires a counter and returns a boolean when verifying", ({
  expectTypeOf,
}) => {
  expectTypeOf(verifyHOTPToken).parameters.toEqualTypeOf<
    [string, string | undefined, number]
  >();
  expectTypeOf(verifyHOTPToken).returns.toEqualTypeOf<boolean>();
});
