import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "./ui/button";
import Image from "next/image";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useState } from "react";

export function AuthTabs({
  tab,
  setTab,
  email,
  password,
  setEmail,
  fullName,
  setFullName,
  setPassword,
  handleLogin,
  isLoading,
}: any) {
  const [showEmailSignUp, setShowEmailSignUp] = useState(false);

  return (
    <div className="bg-transparent border border-neutral-700 rounded-xl p-8 w-full max-w-md">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signUp")}>
        <TabsList className="grid grid-cols-2 w-full bg-transparent border border-neutral-700 rounded-lg">
          <TabsTrigger
            value="login"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-neutral-300"
          >
            Login
          </TabsTrigger>

          <TabsTrigger
            value="signUp"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-neutral-300"
          >
            Sign up
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <Button
            variant="outline"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 border-neutral-600 text-white bg-[#0f0f17] hover:bg-neutral-800 py-5"
          >
            <Image src="/google.png" alt="Google" width={18} height={18} />
            Log in with Google
          </Button>

          <Button
            variant="outline"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 border-neutral-600 text-white bg-[#0f0f17] hover:bg-neutral-800 py-5"
          >
            <Image src="/github.png" alt="Github" width={18} height={18} />
            Log in with GitHub
          </Button>

          <div className="text-center text-neutral-500 text-sm my-4">or</div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label className="text-neutral-300 text-sm">
                Work Email Address
              </Label>
              <Input
                type="email"
                className="bg-neutral-900 border-neutral-700 text-white h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-neutral-300 text-sm">Password</Label>
              <Input
                type="password"
                className="bg-neutral-900 border-neutral-700 text-white h-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <p className="text-center text-xs text-neutral-400">
              I may need to{" "}
              <span
                className="text-green-500 cursor-pointer hover:underline"
                onClick={() => setTab("resetPassword")}
              >
                reset my password.
              </span>
            </p>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 text-md font-semibold disabled:opacity-50"
            >
              {isLoading ? "Logging in..." : "Log In →"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signUp">
          {!showEmailSignUp && (
            <div className="flex flex-col gap-4 justify-center">
              <Button
                variant="outline"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 border-neutral-600 text-white bg-[#0f0f17] hover:bg-neutral-800 py-5"
              >
                <Image src="/google.png" alt="Google" width={18} height={18} />
                Sign up with Google
              </Button>

              <Button
                variant="outline"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 border-neutral-600 text-white bg-[#0f0f17] hover:bg-neutral-800 py-5"
              >
                <Image src="/github.png" alt="Github" width={18} height={18} />
                Sign up with GitHub
              </Button>

              <div className="text-center text-neutral-500 text-sm">or</div>

              <Button
                type="button"
                onClick={() => setShowEmailSignUp(true)}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 text-md font-semibold disabled:opacity-50"
              >
                Sign Up With Email →
              </Button>
            </div>
          )}

          {showEmailSignUp && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label className="text-neutral-300 text-sm">Full Name</Label>
                <Input
                  type="text"
                  className="bg-neutral-900 border-neutral-700 text-white h-11"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-neutral-300 text-sm">
                  Work Email Address
                </Label>
                <Input
                  type="email"
                  className="bg-neutral-900 border-neutral-700 text-white h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Work Email Address"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-neutral-300 text-sm">Password</Label>
                <Input
                  type="password"
                  className="bg-neutral-900 border-neutral-700 text-white h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  disabled={isLoading}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 text-md font-semibold disabled:opacity-50"
              >
                {isLoading ? "Signing up..." : "Sign Up →"}
              </Button>

              <p
                className="text-center text-sm text-neutral-400 hover:underline cursor-pointer"
                onClick={() => setShowEmailSignUp(false)}
              >
                ← Sign up with other options
              </p>
            </form>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}