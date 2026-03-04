// app/verify-email/page.tsx
import VerifyEmailClient from "@/components/verify-email";
import { Suspense } from "react";

export default function Page() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Verificando…</div>}>
            <VerifyEmailClient />
        </Suspense>
    );
}
