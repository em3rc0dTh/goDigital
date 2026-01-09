import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ResetPasswordFormProps {
  email: string;
  setEmail: (email: string) => void;
  onBack: () => void;
}

export function ResetPasswordForm({ email, setEmail, onBack }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'If an account exists with this email, you will receive a password reset link shortly.'
        });
        setEmail('');
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to send reset link. Please try again.'
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setMessage({
        type: 'error',
        text: 'Network error. Please check your connection and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#141420] border border-neutral-700 rounded-xl p-8 w-full max-w-md">
      <Tabs value="reset">
        <TabsList className="grid grid-cols-1 w-full bg-transparent border border-neutral-700 rounded-lg">
          <TabsTrigger
            value="reset"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-neutral-300"
          >
            Reset Password
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reset" className="space-y-4">
          <div className="text-center text-neutral-400 text-sm mb-2">
            Enter your email to receive a password reset link
          </div>

          {message && (
            <Alert
              className={`${message.type === 'success'
                ? 'bg-green-950/50 border-green-800 text-green-200'
                : 'bg-red-950/50 border-red-800 text-red-200'
                }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription className="ml-2">
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-2">
              <Input
                type="email"
                placeholder="your.email@example.com"
                className="bg-neutral-900 border-neutral-700 text-white h-11 placeholder:text-neutral-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 text-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>

            <p className="text-center text-xs text-neutral-400">
              Remember your password?{" "}
              <span
                className="text-green-500 cursor-pointer hover:underline font-medium"
                onClick={onBack}
              >
                Back to login
              </span>
            </p>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}