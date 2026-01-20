"use client";
import { useI18n } from "@/i18n/I18nProvider";

export function AuthLeftContent({
  tab,
}: {
  tab: "login" | "signUp" | "resetPassword" | "signUpEmail";
}) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col justify-center max-w-md mx-auto">
      {/* <div className="flex justify-start">
        <h2 className="text-2xl font-semibold opacity-90 text-white">
          {process.env.NEXT_PUBLIC_PROJECT}
        </h2>
      </div> */}
      <div className="flex flex-col  text-white space-y-6 px-4">
        {tab === "login" && (
          <>
            <h1 className="text-5xl font-bold leading-tight">
              {t("Auth.LeftContent.Login.title1")}
              <br />
              {t("Auth.LeftContent.Login.title2")}
            </h1>

            <p className="text-neutral-300 max-w-xl text-lg">
              {t("Auth.LeftContent.Login.description")}
            </p>
          </>
        )}

        {tab === "signUp" && (
          <>
            <h1 className="text-5xl font-bold leading-tight">
              {t("Auth.LeftContent.SignUp.title1")}
              <br />
              {t("Auth.LeftContent.SignUp.title2")}
            </h1>

            <p className="text-neutral-300 max-w-xl text-lg">
              {t("Auth.LeftContent.SignUp.description")}
            </p>

            <p className="text-neutral-300 max-w-xl text-lg">
              {t("Auth.LeftContent.SignUp.subDescription")}
            </p>
          </>
        )}
        {tab === "signUpEmail" && (
          <>
            <h1 className="text-5xl font-bold leading-tight">
              {t("Auth.LeftContent.SignUp.title1")}
              <br />
              {t("Auth.LeftContent.SignUp.title2")}
            </h1>

            <p className="text-neutral-300 max-w-xl text-lg">
              {t("Auth.LeftContent.SignUp.description")}
            </p>

            <p className="text-neutral-300 max-w-xl text-lg">
              {t("Auth.LeftContent.SignUp.subDescription")}
            </p>
          </>
        )}
        {tab === "resetPassword" && (
          <>
            <h1 className="text-5xl font-bold leading-tight">
              {t("Auth.LeftContent.ResetPassword.title1")}
              <br />
              {t("Auth.LeftContent.ResetPassword.title2")}
            </h1>
            <p className="text-neutral-300 max-w-xl text-lg">
              {t("Auth.LeftContent.ResetPassword.description")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
