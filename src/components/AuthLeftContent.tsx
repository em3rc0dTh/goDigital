"use client";
export function AuthLeftContent({
  tab,
}: {
  tab: "login" | "signUp" | "resetPassword" | "signUpEmail";
}) {
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
              Pro Tip:
              <br />
              Stay secure with fine grain access control.
            </h1>

            <p className="text-neutral-300 max-w-xl text-lg">
              Your organization's source of truth for secrets across all
              projects, teams, and infrastructure.
            </p>
          </>
        )}

        {tab === "signUp" && (
          <>
            <h1 className="text-5xl font-bold leading-tight">
              SecretOps Platform
              <br />
              Get Started Now
            </h1>

            <p className="text-neutral-300 max-w-xl text-lg">
              Your organization's source of truth for secrets across all
              projects.
            </p>

            <p className="text-neutral-300 max-w-xl text-lg">
              Seamlessly integrate with your existing workflows.
            </p>
          </>
        )}
        {tab === "signUpEmail" && (
          <>
            <h1 className="text-5xl font-bold leading-tight">
              SecretOps Platform
              <br />
              Get Started Now
            </h1>

            <p className="text-neutral-300 max-w-xl text-lg">
              Your organization's source of truth for secrets across all
              projects.
            </p>

            <p className="text-neutral-300 max-w-xl text-lg">
              Seamlessly integrate with your existing workflows.
            </p>
          </>
        )}
        {tab === "resetPassword" && (
          <>
            <h1 className="text-5xl font-bold leading-tight">
              Reset your password
              <br />
              in just a couple minutes.
            </h1>
            <p className="text-neutral-300 max-w-xl text-lg">
              Your organization's source of truth for secrets across all
              projects.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
