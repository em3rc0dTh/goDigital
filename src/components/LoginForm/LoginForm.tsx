"use client";

import { useState } from "react";
import { AuthLeftContent } from "../AuthLeftContent";
import { AuthTabs } from "../AuthTabs";
import { ResetPasswordForm } from "../ResetPasswordForm";

export function LoginForm() {
  const [tab, setTab] = useState<
    "login" | "signUp" | "resetPassword" | "signUpEmail"
  >("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const handleLogin = () => {};

  return (
    <div className="max-h-screen bg-transparent flex items-center justify-center">
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-10 px-6 py-10">
        <AuthLeftContent tab={tab} />

        {tab === "resetPassword" ? (
          <ResetPasswordForm
            email={email}
            setEmail={setEmail}
            onBack={() => setTab("login")}
          />
        ) : (
          <AuthTabs
            tab={tab}
            setTab={setTab}
            email={email}
            password={password}
            setEmail={setEmail}
            setPassword={setPassword}
            fullName={fullName}
            setFullName={setFullName}
            handleLogin={handleLogin}
          />
        )}
      </div>
    </div>
  );
}
