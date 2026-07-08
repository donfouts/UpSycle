// Shared centered container for auth-adjacent pages (seller signup, pending
// review, sign-in, etc). A route group — doesn't add a URL segment.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-32 pb-24 md:px-8">{children}</div>
  );
}
