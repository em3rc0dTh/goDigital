"use client";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function DopplerWelcome() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const next = () => setStep((prev) => Math.min(prev + 1, 3));
  const back = () => setStep((prev) => Math.max(prev - 1, 1));

  const fadeSlide = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
    transition: { duration: 0.35, ease: "easeOut" as const },
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0a0a0a] overflow-hidden font-sans text-white selection:bg-purple-500/30">
      {/* Luces decorativas */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-900/40 rounded-full blur-[120px] pointer-events-none opacity-60" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-emerald-900/30 rounded-full blur-[120px] pointer-events-none opacity-50" />

      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-900/40 rounded-full blur-[120px] pointer-events-none opacity-60 mix-blend-screen" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-emerald-900/30 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-screen" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-8 py-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-white" />
          <span className="text-3xl font-bold tracking-tight">
            {process.env.NEXT_PUBLIC_PROJECT}
          </span>
        </div>
        <Link
          href="#"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Sign out
        </Link>
      </nav>

      {/* Layout principal */}
      <main className="relative z-10 flex flex-col lg:flex-row items-center justify-center px-6 lg:px-20 gap-12 lg:gap-24">
        {/* Left Text Section */}
        <div className="flex-1 flex flex-col items-start space-y-6 text-center lg:text-left">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight text-white">
            Welcome to <br className="hidden md:block" />
            {process.env.NEXT_PUBLIC_PROJECT}!
          </h1>
          <p className="text-base md:text-lg text-zinc-400 leading-relaxed max-w-md mx-auto lg:mx-0">
            Tell us more about yourself so we can improve your{" "}
            {process.env.NEXT_PUBLIC_PROJECT} experience.
          </p>
        </div>

        {/* Right: Dynamic Card */}
        <div className="flex-1 flex justify-center w-full pt-10 lg:pt-0">
          <AnimatePresence mode="wait">
            <motion.div key={step} {...fadeSlide} className="w-full max-w-md">
              {/* CARD CONTENIDO */}
              {step === 1 && (
                <Card className="border-zinc-800 bg-[#121212] shadow-2xl shadow-black/50">
                  <CardHeader className="space-y-1 pb-6">
                    <CardTitle className="text-xl text-white">
                      Name your workplace
                    </CardTitle>
                    <CardDescription className="text-zinc-400 text-sm leading-relaxed">
                      Give your workplace a name that represents your team.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
                        Workplace Name
                      </Label>
                      <Input
                        placeholder="Radar Industries"
                        className="bg-[#1a1a1a] border-zinc-700 text-white placeholder:text-zinc-600 h-11"
                      />
                    </div>

                    <Button
                      onClick={next}
                      className="w-full bg-[#6366f1] hover:bg-[#5558e6] h-11"
                    >
                      Next
                    </Button>
                  </CardContent>

                  <CardFooter className="flex flex-col justify-center pt-2">
                    <Link
                      href="#"
                      className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
                    >
                      I'm joining an existing workplace
                    </Link>
                    {/* Dots Stepper */}
                    <div className="mt-3 w-full flex justify-center gap-2">
                      {[1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          className={`h-2 w-2 rounded-full ${step === i ? "bg-purple-500" : "bg-zinc-700"}`}
                          animate={{ scale: step === i ? 1.4 : 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      ))}
                    </div>
                  </CardFooter>
                </Card>
              )}

              {step === 2 && (
                <Card className="border-zinc-800 bg-[#121212] shadow-2xl shadow-black/50">
                  <CardHeader className="space-y-1 pb-6">
                    <CardTitle className="text-xl text-white">
                      What will you use it for?
                    </CardTitle>
                    <CardDescription className="text-zinc-400 text-sm leading-relaxed">
                      Personalize your experience.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <Button>Personal Projects</Button>
                      <Button>Work Projects</Button>
                      <Button>Not sure yet</Button>
                    </div>

                    <Button className="w-full bg-[#6366f1] h-11" onClick={next}>
                      Next
                    </Button>

                    <Button variant="ghost" className="w-full" onClick={back}>
                      Back
                    </Button>
                  </CardContent>
                  <CardFooter>
                    <div className="mt-3 w-full flex justify-center gap-2">
                      {[1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          className={`h-2 w-2 rounded-full ${step === i ? "bg-purple-500" : "bg-zinc-700"}`}
                          animate={{ scale: step === i ? 1.4 : 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      ))}
                    </div>
                  </CardFooter>
                </Card>
              )}

              {step === 3 && (
                <Card className="border-zinc-800 bg-[#121212] shadow-2xl shadow-black/50">
                  <CardHeader className="space-y-1 pb-6">
                    <CardTitle className="text-xl text-white">
                      Which service do you use?
                    </CardTitle>
                    <CardDescription className="text-zinc-400 text-sm leading-relaxed">
                      Select anything you frequently use.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Button>AWS Parameter Store</Button>
                      <Button>AWS Secrets Manager</Button>
                      <Button>Azure App Service</Button>
                      <Button>Azure DevOps</Button>
                      <Button>Azure Key Vault</Button>
                      <Button>Bitbucket</Button>
                    </div>

                    <Button
                      className="w-full bg-[#6366f1] h-11"
                      onClick={() => {
                        router.push("../");
                      }}
                    >
                      Finish
                    </Button>

                    <Button variant="ghost" className="w-full" onClick={back}>
                      Back
                    </Button>
                  </CardContent>
                  <CardFooter>
                    <div className="mt-3 w-full flex justify-center gap-2">
                      {[1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          className={`h-2 w-2 rounded-full ${step === i ? "bg-purple-500" : "bg-zinc-700"}`}
                          animate={{ scale: step === i ? 1.4 : 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      ))}
                    </div>
                  </CardFooter>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
