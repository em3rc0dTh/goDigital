// app/reset-password/page.tsx
import ResetPasswordClient from "@/components/reset-password";
import { Suspense } from "react";

export default function Page() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando…</div>}>
            <ResetPasswordClient />
        </Suspense>
    );
}
