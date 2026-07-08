import { Suspense } from "react";

import ConfirmSignupForm from "./ConfirmSignupForm";

export const dynamic = "force-dynamic";

export default function ConfirmSignupPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmSignupForm />
    </Suspense>
  );
}
