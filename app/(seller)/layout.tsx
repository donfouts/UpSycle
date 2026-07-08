// Shared centered container for seller-signup-adjacent pages (application
// form, pending-review confirmation). A separate route group from `(auth)`
// (login/buyer-signup/forgot-password) since the seller form has far more
// fields and needs a wider column than the narrow auth-card layout.
export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-32 pb-24 md:px-8">{children}</div>
  );
}
