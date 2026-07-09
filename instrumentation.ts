// Next.js instrumentation hook — runs once when the server starts, before
// any request handling.
//
// Currently a no-op. Multiple attempts to populate DATABASE_URL here for the
// deployed Amplify environment were tried and reverted:
//  - Fetching from Secrets Manager at runtime: fails with
//    CredentialsProviderError — this Amplify SSR compute doesn't expose IAM
//    role credentials via the standard AWS SDK chain at all.
//  - Statically importing a build-time-generated JSON config file: caused
//    the entire deployed function to 502 (a harder crash than the plain
//    500 from DATABASE_URL simply being unset), likely a bundling/module
//    resolution issue specific to this runtime. Reverted immediately rather
//    than risk shipping a broken deploy.
//
// Local dev is unaffected either way — DATABASE_URL comes from `.env` there.
export async function register() {}
