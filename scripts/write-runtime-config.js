// Run during the Amplify build (see infra/lib/stacks/hosting-stack.ts's
// buildSpec), AFTER `next build`, so `.next` already exists. Writes into
// `.next/` specifically because Amplify's deployment artifact only includes
// `.next/**/*` (baseDirectory: .next) — a file written anywhere else in the
// repo (e.g. a plain lib/*.json committed source file, tried previously)
// isn't guaranteed to survive into the deployed package the same way.
// instrumentation.ts reads this back via fs at runtime, not a static
// import — a static import of this exact kind of generated file caused a
// hard 502 crash previously, likely a bundling/module-resolution issue.
const fs = require("fs");

console.log("write-runtime-config: DATABASE_URL present =", Boolean(process.env.DATABASE_URL));

fs.writeFileSync(
  ".next/generated-runtime-config.json",
  JSON.stringify({ databaseUrl: process.env.DATABASE_URL || null }),
);

console.log(
  "write-runtime-config: wrote",
  fs.statSync(".next/generated-runtime-config.json").size,
  "bytes to .next/generated-runtime-config.json",
);
