// Run as a NodejsFunction `afterBundling` command hook (see
// ../../lib/stacks/placement-stack.ts). `@prisma/client` is kept out of the
// esbuild bundle (bundling.externalModules) because its runtime code does a
// non-statically-analyzable `require()` for the model-specific client it
// wraps -- esbuild can't follow that. The published `@prisma/client` package
// is only a thin wrapper, though; the actual usable client (generated types
// + the native query engine binary) is produced locally by `prisma generate`
// into node_modules/.prisma and is never itself an npm dependency, so it has
// to be copied by hand too. Plain argv-based Node script (not an inline
// shell one-liner) so the command string stays identical/quote-safe on both
// POSIX and Windows shells, since CDK bundling command hooks run through
// whatever local shell is available.
const fs = require("fs");
const path = require("path");

const outputDir = process.argv[2];
if (!outputDir) {
  throw new Error("copy-prisma-engine.js: missing <outputDir> argument");
}

// infra/lambda/placement -> infra/lambda -> infra -> repo root (where the
// Next.js app's own node_modules/@prisma/client + node_modules/.prisma live).
const appRoot = path.join(__dirname, "..", "..", "..");

for (const pkg of ["@prisma/client", ".prisma"]) {
  const source = path.join(appRoot, "node_modules", pkg);
  const destination = path.join(outputDir, "node_modules", pkg);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
}
