import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "./ui/button";
import Image from "next/image";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

export function AuthTabs({
  tab,
  setTab,
  email,
  password,
  setEmail,
  fullName,
  setFullName,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  handleLogin,
  handleGoogleLogin,
  isLoading,
}: any) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { t } = useI18n();

  return (
    <div className="bg-transparent border border-neutral-700 rounded-xl p-8 w-full max-w-md">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signUp")}>
        <TabsList className="grid grid-cols-2 w-full bg-transparent border border-neutral-700 rounded-lg">
          <TabsTrigger
            value="login"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-neutral-300"
          >
            {t("Auth.Tabs.login")}
          </TabsTrigger>

          <TabsTrigger
            value="signUp"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-neutral-300"
          >
            {t("Auth.Tabs.signUp")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <div className="w-full flex justify-center mb-4">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => console.log('Login Failed')}
              theme="filled_black"
              shape="pill"
              width="300"
              text="signin_with"
            />
          </div>

          <div className="text-center text-neutral-500 text-sm my-4">{t("Auth.Messages.or")}</div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label className="text-neutral-300 text-sm">
                {t("Auth.Labels.workEmail")}
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

            <div className="flex flex-col gap-2 relative">
              <Label className="text-neutral-300 text-sm">{t("Auth.Labels.password")}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  className="bg-neutral-900 border-neutral-700 text-white h-11 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-neutral-400">
              {t("Auth.Messages.needReset")}
              <span
                className="text-green-500 cursor-pointer hover:underline"
                onClick={() => setTab("resetPassword")}
              >
                {t("Auth.Buttons.resetPasswordLink")}
              </span>
            </p>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 text-md font-semibold disabled:opacity-50"
            >
              {isLoading ? t("Auth.Buttons.loggingIn") : t("Auth.Buttons.login")}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signUp">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label className="text-neutral-300 text-sm">{t("Auth.Labels.fullName")}</Label>
              <Input
                type="text"
                className="bg-neutral-900 border-neutral-700 text-white h-11"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("Auth.Placeholders.fullName")}
                disabled={isLoading}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-neutral-300 text-sm">
                {t("Auth.Labels.workEmail")}
              </Label>
              <Input
                type="email"
                className="bg-neutral-900 border-neutral-700 text-white h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("Auth.Placeholders.workEmail")}
                disabled={isLoading}
                required
              />
            </div>

            <div className="flex flex-col gap-2 relative">
              <Label className="text-neutral-300 text-sm">{t("Auth.Labels.password")}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  className="bg-neutral-900 border-neutral-700 text-white h-11 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("Auth.Placeholders.password")}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 relative">
              <Label className="text-neutral-300 text-sm">{t("Auth.Labels.confirmPassword")}</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  className="bg-neutral-900 border-neutral-700 text-white h-11 pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("Auth.Placeholders.confirmPassword")}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 text-md font-semibold disabled:opacity-50"
            >
              {isLoading ? t("Auth.Buttons.signingUp") : t("Auth.Buttons.signUp")}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}