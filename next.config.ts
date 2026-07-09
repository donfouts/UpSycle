import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output produces a minimal, self-contained server bundle
  // (only the files actually needed at runtime, with a pruned
  // node_modules) — the standard shape for a Docker-deployed Next.js app,
  // used by the Dockerfile's runtime stage. Moving off Amplify Hosting to
  // AWS App Runner (see infra/lib/stacks/apprunner-stack.ts) specifically
  // because App Runner's container environment variables / Secrets Manager
  // integration are a mature, well-established mechanism — unlike Amplify
  // Web Compute's, which never reliably delivered env vars to the running
  // Next.js SSR process despite extensive troubleshooting (see git history
  // on hosting-stack.ts, now removed, for the full account).
  output: "standalone",
};

export default nextConfig;
