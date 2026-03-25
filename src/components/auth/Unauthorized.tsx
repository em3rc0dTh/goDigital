"use client";

import React from "react";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

/**
 * Standard unauthorized component.
 * Used for showing an access restricted state.
 * @returns React.ReactNode
 */
export default function Unauthorized() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-6 animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
        <ShieldAlert className="w-10 h-10 text-red-600" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">No Autorizado</h1>
        <p className="text-gray-600 max-w-md mx-auto">
          No tienes los permisos necesarios para acceder a esta sección. 
          Contacta con el administrador de tu workspace si crees que esto es un error.
        </p>
      </div>

      <Button
        onClick={() => router.back()}
        variant="outline"
        className="gap-2 hover:bg-gray-50 flex items-center"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver atrás
      </Button>
    </div>
  );
}
