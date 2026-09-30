import { test } from "@japa/runner";
import { generateToken, verifyToken, verifyTokenOnce } from "../lib/index.js";

const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
const RFC_6238_TOKENS: [number, string][] = [
  [59, "287082"],
  [1111111109, "081804"],
  [1111111111, "050471"],
  [1234567890, "005924"],
  [2000000000, "279037"],
  [20000000000, "353130"],
];
const STEP_START = 1234567890;
const STEP = STEP_START / 30;
const STEP_TOKEN = "005924";

function atTime(unixSeconds: number, run: () => void) {
  const realNow = Date.now;
  Date.now = () => unixSeconds * 1000;
  try {
    run();
  } finally {
    Date.now = realNow;
  }
}

test("generates the RFC 6238 test vectors", ({ expect }) => {
  for (const [unixSeconds, token] of RFC_6238_TOKENS) {
    atTime(unixSeconds, () => {
      expect(generateToken(RFC_SECRET)).toEqual({ token });
      expect(verifyToken(RFC_SECRET, token, 0)).toBe(true);
    });
  }
});

test("accepts tokens one step away by default", ({ expect }) => {
  atTime(STEP_START + 30, () => {
    expect(verifyToken(RFC_SECRET, STEP_TOKEN)).toBe(true);
    expect(verifyToken(RFC_SECRET, STEP_TOKEN, 0)).toBe(false);
  });
  atTime(STEP_START - 30, () => {
    expect(verifyToken(RFC_SECRET, STEP_TOKEN)).toBe(true);
  });
  atTime(STEP_START + 60, () => {
    expect(verifyToken(RFC_SECRET, STEP_TOKEN)).toBe(false);
    expect(verifyToken(RFC_SECRET, STEP_TOKEN, 2)).toBe(true);
  });
});

test("supports asymmetric [past, future] windows", ({ expect }) => {
  atTime(STEP_START - 30, () => {
    expect(verifyToken(RFC_SECRET, STEP_TOKEN, [1, 0])).toBe(false);
    expect(verifyToken(RFC_SECRET, STEP_TOKEN, [0, 1])).toBe(true);
  });
});

test("does not keep the window between calls", ({ expect }) => {
  atTime(STEP_START + 90, () => {
    expect(verifyToken(RFC_SECRET, STEP_TOKEN, 3)).toBe(true);
    expect(verifyToken(RFC_SECRET, STEP_TOKEN)).toBe(false);
  });
});

test("rejects invalid secrets", ({ expect }) => {
  const invalidSecrets = [
    "",
    "   ",
    "1",
    "JBSW Y3DP EHPK 3PXP",
    "GEZDGNBVGY3TQOI",
  ];
  atTime(STEP_START, () => {
    for (const secret of invalidSecrets) {
      expect(generateToken(secret)).toBeNull();
      expect(verifyToken(secret, STEP_TOKEN)).toBe(false);
    }
  });
});

test("rejects missing or malformed tokens", ({ expect }) => {
  const invalidTokens = [undefined, "", "00592", "0059240", "abcdef", " 05924"];
  atTime(STEP_START, () => {
    for (const token of invalidTokens) {
      expect(verifyToken(RFC_SECRET, token)).toBe(false);
    }
  });
});

test("throws on invalid windows", ({ expect }) => {
  const invalidWindows: (number | [number, number])[] = [
    -1,
    1.5,
    NaN,
    Infinity,
    [1, -1],
    [0.5, 0],
    50,
    [0, 99],
  ];
  for (const window of invalidWindows) {
    expect(() => verifyToken(RFC_SECRET, STEP_TOKEN, window)).toThrow(
      RangeError,
    );
    expect(() => verifyToken(RFC_SECRET, "abc", window)).toThrow(RangeError);
  }
  expect(verifyToken(RFC_SECRET, STEP_TOKEN, [49, 49])).toBe(false);
  expect(verifyToken(RFC_SECRET, STEP_TOKEN, [98, 0])).toBe(false);
});

test("ignores options added to Object.prototype", ({ expect }) => {
  const prototype = Object.prototype as Record<string, unknown>;
  const pollution = { strategy: "hotp", counter: 0, t0: 30000, period: 60 };
  let result: { timeStep: number } | null = null;
  atTime(STEP_START, () => {
    Object.assign(prototype, pollution);
    try {
      result = verifyTokenOnce(RFC_SECRET, STEP_TOKEN);
    } finally {
      for (const key of Object.keys(pollution)) delete prototype[key];
    }
  });
  expect(result).toEqual({ timeStep: STEP });
});

test("returns a boolean when verifying", ({ expectTypeOf }) => {
  expectTypeOf(verifyToken).returns.toEqualTypeOf<boolean>();
});

test("verifyTokenOnce returns the time step the token matched", ({
  expect,
}) => {
  atTime(STEP_START, () => {
    expect(verifyTokenOnce(RFC_SECRET, STEP_TOKEN)).toEqual({ timeStep: STEP });
  });
  atTime(STEP_START + 30, () => {
    expect(verifyTokenOnce(RFC_SECRET, STEP_TOKEN)).toEqual({ timeStep: STEP });
  });
  atTime(STEP_START - 30, () => {
    expect(verifyTokenOnce(RFC_SECRET, STEP_TOKEN)).toEqual({ timeStep: STEP });
  });
});

test("verifyTokenOnce rejects tokens from the last time step or earlier", ({
  expect,
}) => {
  atTime(STEP_START, () => {
    expect(verifyTokenOnce(RFC_SECRET, STEP_TOKEN, STEP)).toBeNull();
    expect(verifyTokenOnce(RFC_SECRET, STEP_TOKEN, STEP - 1)).toEqual({
      timeStep: STEP,
    });
    expect(verifyTokenOnce(RFC_SECRET, STEP_TOKEN, null)).toEqual({
      timeStep: STEP,
    });
  });
  atTime(STEP_START + 30, () => {
    const nextToken = generateToken(RFC_SECRET)?.token;
    expect(verifyTokenOnce(RFC_SECRET, STEP_TOKEN, STEP)).toBeNull();
    expect(verifyTokenOnce(RFC_SECRET, nextToken, STEP)).toEqual({
      timeStep: STEP + 1,
    });
  });
});

test("verifyTokenOnce returns null when the last time step is past the window", ({
  expect,
}) => {
  atTime(STEP_START, () => {
    expect(verifyTokenOnce(RFC_SECRET, STEP_TOKEN, STEP + 1)).toBeNull();
    expect(verifyTokenOnce(RFC_SECRET, STEP_TOKEN, STEP + 5)).toBeNull();
    expect(
      verifyTokenOnce(RFC_SECRET, STEP_TOKEN, STEP + 1, [1, 0]),
    ).toBeNull();
  });
});

test("verifyTokenOnce rejects invalid secrets and tokens", ({ expect }) => {
  atTime(STEP_START, () => {
    expect(verifyTokenOnce("", STEP_TOKEN)).toBeNull();
    expect(verifyTokenOnce(RFC_SECRET, undefined)).toBeNull();
    expect(verifyTokenOnce(RFC_SECRET, "abcdef")).toBeNull();
  });
});

test("verifyTokenOnce throws on invalid last time steps and windows", ({
  expect,
}) => {
  for (const lastTimeStep of [-1, 1.5, NaN, Infinity]) {
    expect(() => verifyTokenOnce(RFC_SECRET, STEP_TOKEN, lastTimeStep)).toThrow(
      RangeError,
    );
  }
  expect(() => verifyTokenOnce(RFC_SECRET, STEP_TOKEN, null, -1)).toThrow(
    RangeError,
  );
});

test("verifyTokenOnce returns the matched time step or null", ({
  expectTypeOf,
}) => {
  expectTypeOf(verifyTokenOnce).returns.toEqualTypeOf<{
    timeStep: number;
  } | null>();
});
