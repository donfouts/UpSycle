import type { NextConfig } from "next";

// Non-sensitive deploy config baked in at build time via next.config's `env`,
// rather than relying on Amplify Hosting's app-level environment variables.
// Amplify's app/branch-level env vars are confirmed present in build logs
// but never reach the deployed SSR compute at request time (build-time
// works, runtime doesn't — verified, not yet resolved on AWS's side).
// DATABASE_URL is NOT handled this way since it's sensitive — see
// instrumentation.ts, which fetches it from Secrets Manager at server
// startup instead.
const nextConfig: NextConfig = {
  env: {
    COGNITO_REGION: "us-west-2",
    COGNITO_USER_POOL_ID: "us-west-2_2sVkwk58T",
    COGNITO_USER_POOL_CLIENT_ID: "5dv9fg5mc6lpo73k7sqah02oak",
    PHOTOS_BUCKET_NAME: "upsycle-storagestack-productphotosbucketc3e952f6-xdq853ji6qqf",
  },
};

export default nextConfig;
