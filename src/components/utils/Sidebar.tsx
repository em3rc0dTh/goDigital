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
  Rocket,
  TowerControl,
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
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
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
import { useI18n } from "@/i18n/I18nProvider";
import Swal from "sweetalert2";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname(); // ← Obtener la ruta actual
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";
  const menuItems = [
    {
      icon: Sparkles,
      label: t("Sidebar.menu.Home"),
      link: "/home",
    },
    { icon: Rocket, label: t("Sidebar.menu.LaunchPad"), link: "/getting-started" },
    { icon: TowerControl, label: t("Sidebar.menu.MissionControl"), link: "/management" },
    { icon: Folder, label: t("Sidebar.menu.Projects"), link: "/projects" },
    { icon: Activity, label: t("Sidebar.menu.Activity"), link: "/activity" },
    { icon: Users, label: t("Sidebar.menu.Team"), link: "/team" },
    { icon: Coins, label: t("Sidebar.menu.Tokens"), link: "/tokens" },
    { icon: CreditCard, label: t("Sidebar.menu.Billing"), link: "/billing" },
    { icon: Landmark, label: t("Sidebar.menu.BankExtract"), link: "/extract" },
  ];

  const bottomItems = [
    { icon: Settings, label: t("Sidebar.bottom.Settings"), link: "/settings" },
    { icon: LogOut, label: t("Sidebar.bottom.LogOut"), action: "logout" },
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
              setCollapsed={() => { }}
              menuItems={menuItems}
              bottomItems={bottomItems}
              router={router}
              pathname={pathname}
              closeMobileMenu={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside
        className={`hidden lg:flex flex-col h-screen border-r bg-background transition-all duration-300 ${collapsed ? "w-16" : "w-64"
          }`}
      >
        <SidebarContent
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          menuItems={menuItems}
          bottomItems={bottomItems}
          router={router}
          pathname={pathname}
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
  pathname,
  closeMobileMenu,
}: any) {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";
  const handleLogout = async () => {
    if (closeMobileMenu) closeMobileMenu();
    const result = await Swal.fire({
      title: "¿Cerrar sesión?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Cerrar sesión",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#ef4444",
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: "Cerrando sesión...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      await fetch(`${API_BASE}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch { }

    Cookies.remove("session_token");
    Cookies.remove("tenantId");
    Cookies.remove("workspaceName");
    Cookies.remove("userRole");
    Cookies.remove("temp_token");

    localStorage.clear();
    sessionStorage.clear();

    Swal.close();
    router.replace("/login");
  };


  return (
    <>
      {/* HEADER */}
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
          className="ml-auto hidden lg:flex"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* MENU */}
      <ScrollArea className="flex-1 px-2 py-3">
        {menuItems.map((item: any, index: number) => {
          const isActive =
            item.link === "/"
              ? pathname === "/"
              : pathname.startsWith(item.link);

          return (
            <Button
              key={index}
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 mb-1 ${collapsed ? "px-2" : "px-3"
                }`}
              onClick={() => {
                router.push(item.link);
                if (closeMobileMenu) closeMobileMenu();
              }}
            >
              <item.icon className="w-5 h-5" />
              {!collapsed && item.label}
            </Button>
          );
        })}
      </ScrollArea>

      <Separator />

      {/* BOTTOM */}
      <ScrollArea className="px-2 py-3">
        {bottomItems.map((item: any, index: number) => (
          <Button
            key={index}
            variant="ghost"
            className={`w-full justify-start gap-3 mb-1 ${collapsed ? "px-2" : "px-3"
              }`}
            onClick={() => {
              if (item.action === "logout") {
                handleLogout();
                return;
              }

              if (item.link) {
                router.push(item.link);
                if (closeMobileMenu) closeMobileMenu();
              }
            }}
          >
            <item.icon className="w-5 h-5" />
            {!collapsed && item.label}
          </Button>
        ))}
      </ScrollArea>
    </>
  );
}
