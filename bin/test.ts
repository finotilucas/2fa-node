import { configure, processCLIArgs, run } from "@japa/runner";
import { expectTypeOf } from "@japa/expect-type";
import { expect } from "@japa/expect";

processCLIArgs(process.argv.splice(2));
configure({
  files: ["tests/**/*.spec.ts"],
  plugins: [expect(), expectTypeOf()],
});

run();
