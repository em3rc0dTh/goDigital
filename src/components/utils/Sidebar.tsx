"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Brain,
  Sparkles,
  Folder,
  Activity,
  Users,
  Coins,
  CreditCard,
  Settings,
  Landmark,
  FileText,
  MessageCircle,
  Share2,
  HelpCircle,
  Signal,
  LogOut,
  Menu,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function Sidebar() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);

  const menuItems = [
    {
      icon: Sparkles,
      label: "Home",
      link: "/",
      active: true,
    },
    { icon: Brain, label: "Getting Started", link: "/getting-started" },
    { icon: Folder, label: "Projects", link: "/projects" },
    { icon: Activity, label: "Activity", link: "/activity" },
    { icon: Users, label: "Team", link: "/team" },
    { icon: Coins, label: "Tokens", link: "/tokens" },
    { icon: CreditCard, label: "Billing", link: "/billing" },
    { icon: Settings, label: "Settings", link: "/settings" },
    { icon: Landmark, label: "Bank Extract", link: "/extract" },
  ];

  const bottomItems = [
    { icon: FileText, label: "Docs" },
    { icon: MessageCircle, label: "Community" },
    { icon: Share2, label: "Share Secret" },
    { icon: HelpCircle, label: "Support" },
    { icon: Signal, label: "Status" },
    { icon: LogOut, label: "Log Out" },
  ];

  return (
    <>
      {/* MOBILE MENU BUTTON */}
      <div className="lg:hidden p-4 ">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="p-0">
            <SheetHeader className="hidden">
              <SheetTitle>Sidebar</SheetTitle>
            </SheetHeader>

            <SidebarContent
              collapsed={false}
              setCollapsed={() => {}}
              menuItems={menuItems}
              bottomItems={bottomItems}
              router={router}
              closeMobileMenu={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside
        className={`hidden lg:flex flex-col h-screen border-r bg-background transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <SidebarContent
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          menuItems={menuItems}
          bottomItems={bottomItems}
          router={router}
        />
      </aside>
    </>
  );
}

function SidebarContent({
  collapsed,
  setCollapsed,
  menuItems,
  bottomItems,
  router,
  closeMobileMenu,
}: any) {
  return (
    <>
      <div className="flex items-center justify-between p-3 py-4">
        {!collapsed && (
          <div className="flex items-center gap-2 font-semibold">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span>{process.env.NEXT_PUBLIC_PROJECT}</span>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto hidden lg:flex items-center justify-center"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        {menuItems.map((item: any, index: number) => (
          <Button
            key={index}
            variant={item.active ? "secondary" : "ghost"}
            className={`w-full justify-start gap-3 mb-1 ${
              collapsed ? "px-2" : "px-3"
            }`}
            onClick={() => {
              router.push(item.link);
              if (closeMobileMenu) closeMobileMenu();
            }}
          >
            <item.icon className="w-5 h-5" />
            {!collapsed && item.label}
          </Button>
        ))}
      </ScrollArea>

      <Separator />

      <ScrollArea className="px-2 py-3">
        {bottomItems.map((item: any, index: number) => {
          const handleClick =
            item.label === "Log Out"
              ? async () => {
                  await fetch("http://localhost:4000/api/logout", {
                    method: "POST",
                    credentials: "include",
                  });
                  window.location.href = "/login";
                }
              : () => {};

          return (
            <Button
              key={index}
              variant="ghost"
              className={`w-full justify-start gap-3 mb-1 ${
                collapsed ? "px-2" : "px-3"
              }`}
              onClick={handleClick}
            >
              <item.icon className="w-5 h-5" />
              {!collapsed && item.label}
            </Button>
          );
        })}
      </ScrollArea>
    </>
  );
}
