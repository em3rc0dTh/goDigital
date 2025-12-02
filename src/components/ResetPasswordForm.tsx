import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function ResetPasswordForm({ email, setEmail, onBack }: any) {
  return (
    <div className="bg-[#141420] border border-neutral-700 rounded-xl p-8 w-full max-w-md">
      <Tabs value="login">
        <TabsList className="grid grid-cols-1 w-full bg-transparent border border-neutral-700 rounded-lg">
          <TabsTrigger
            value="login"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-neutral-300"
          >
            Login
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <div className="text-center text-neutral-500 text-sm">or</div>
          <form className="space-y-4">
            <div className="flex flex-col gap-2">
              <Input
                type="email"
                className="bg-neutral-900 border-neutral-700 text-white h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <p className="text-center text-xs text-neutral-400">
              I remember my password and{" "}
              <span
                className="text-green-500 cursor-pointer hover:underline"
                onClick={onBack}
              >
                want to login.
              </span>
            </p>{" "}
            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 text-md font-semibold"
            >
              Reset my password
            </Button>
          </form>
        </TabsContent>
      </Tabs>
      {/* <h2 className="text-2xl font-semibold text-white mb-4">Reset Password</h2>

      <form className="space-y-4">
        <input
          type="email"
          className="w-full bg-[#1c1c28] border border-neutral-700 px-3 py-2 rounded-md text-white"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button className="w-full bg-blue-600 py-2 rounded-md text-white font-semibold">
          Send recovery link
        </button>

        <button
          type="button"
          className="w-full text-neutral-400 underline text-sm"
          onClick={onBack}
        >
          Back to login
        </button>
      </form> */}
    </div>
  );
}
