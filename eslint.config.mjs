import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The infra/ directory is a separate CDK app with its own tsconfig
    // (excluded from this app's tsconfig too) — its synth output
    // (cdk.out/cdk.out-*) contains bundled Lambda JS, not our source.
    "infra/**",
  ]),
]);

export default eslintConfig;
