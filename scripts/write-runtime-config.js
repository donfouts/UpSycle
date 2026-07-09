// Run during the Amplify build (see infra/lib/stacks/hosting-stack.ts's
// buildSpec) to bake DATABASE_URL into a real source file the Next.js
// bundler traces. Amplify's SSR compute doesn't reliably expose
// app/branch-level environment variables OR IAM role credentials at request
// time (confirmed via extensive testing — see instrumentation.ts's doc
// comment), but build-time env vars work fine, so this captures the value
// while it's actually available.
const fs = require("fs");

fs.writeFileSync(
  "lib/generated-runtime-config.json",
  JSON.stringify({ databaseUrl: process.env.DATABASE_URL || null }),
);
