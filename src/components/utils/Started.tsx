"use client";
import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Sun,
  MessageSquare,
  Bell,
  Folder,
  Activity,
  Users,
  Coins,
  CreditCard,
  Settings,
  FileText,
  MessageCircle,
  Share2,
  HelpCircle,
  Signal,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

export default function GettingStarted() {
  const [expandedSection, setExpandedSection] = useState("workplace");

  return (
    <main className="flex-1 overflow-y-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search for Shortcuts, Projects, Secrets, etc."
                className="pl-10 bg-gray-50 border-gray-200"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 font-mono">
                ⌘+K
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <Button variant="ghost" size="icon">
              <Sun className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MessageSquare className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <Avatar>
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Getting Started Content */}
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Getting Started</h1>

        <div className="flex gap-8">
          <div className="flex-1 max-w-2xl">
            {/* Set up your workplace */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Set up your workplace</CardTitle>
                  <span className="text-sm text-gray-500">0%</span>
                </div>
                <Progress value={0} className="mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                {/* First Project */}
                <div className="border rounded-lg p-4">
                  <button
                    onClick={() =>
                      setExpandedSection(
                        expandedSection === "project" ? "" : "project"
                      )
                    }
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                      <span className="font-medium">
                        Set up your first project
                      </span>
                    </div>
                    {expandedSection === "project" ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {expandedSection === "project" && (
                    <div className="mt-4 pl-9 space-y-3">
                      <p className="text-sm text-gray-600">
                        Projects are where you define configurations and manage
                        secrets for a single service or application.
                      </p>
                      <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                        <li>
                          Projects start with three default environments, each
                          with a root config: Development, Staging and
                          Production
                        </li>
                        <li>
                          You can branch configs to allow overrides from the
                          root configs
                        </li>
                      </ul>
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                        Projects →
                      </Button>
                    </div>
                  )}
                </div>

                {/* First Integration */}
                <button className="w-full border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                    <span className="font-medium">
                      Set up your first integration
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>

                {/* Invite teammates */}
                <button className="w-full border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                    <span className="font-medium">Invite teammates</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </CardContent>
            </Card>

            {/* Set up your account */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Set up your account</CardTitle>
                  <span className="text-sm text-gray-500">0%</span>
                </div>
                <Progress value={0} className="mt-2" />
              </CardHeader>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Joining your team's workplace? Some of the items may already
                  be completed.
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">
                  If you want to test all of these capabilities Doppler has to
                  offer,{" "}
                  <a href="#" className="text-purple-600 hover:underline">
                    create a new personal workplace
                  </a>{" "}
                  to go through Getting Started. You can use your personal
                  workplace as a sandbox or delete it at any time. Your progress
                  will be saved from workplace to workplace.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Need more help?</CardTitle>
                <CardDescription>
                  Check out these relevant Doppler Docs for more information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <a
                  href="#"
                  className="flex items-center gap-2 text-purple-600 hover:underline text-sm"
                >
                  📖 Welcome
                </a>
                <a
                  href="#"
                  className="flex items-center gap-2 text-purple-600 hover:underline text-sm"
                >
                  📖 Get Started
                </a>
                <a
                  href="#"
                  className="flex items-center gap-2 text-purple-600 hover:underline text-sm"
                >
                  📖 Tutorials
                </a>
                <a
                  href="#"
                  className="flex items-center gap-2 text-purple-600 hover:underline text-sm"
                >
                  📖 Demo Videos
                </a>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="text-purple-600 text-xs font-semibold uppercase">
                    💡 Pro Tip
                  </span>
                </div>
                <CardTitle className="text-base">Project Naming</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">
                  A project should be considered an encapsulated application
                  service. Rather than naming a project after your application,
                  we suggest...
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};
