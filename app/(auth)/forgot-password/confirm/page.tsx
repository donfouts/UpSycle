import { Suspense } from "react";

import ConfirmForgotPasswordForm from "./ConfirmForgotPasswordForm";

export const dynamic = "force-dynamic";

export default function ConfirmForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmForgotPasswordForm />
    </Suspense>
  );
}
