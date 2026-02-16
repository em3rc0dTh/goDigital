"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
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
  ScrollText,
  LogOut,
  Menu,
  Briefcase,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import SidebarContent from "./SidebarContent";

const MobileSidebar = dynamic(() => import("./MobileSidebar"), {
  ssr: false,
  loading: () => (
    <Button variant="outline" size="icon">
      <Menu className="w-5 h-5" />
    </Button>
  ),
});

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useI18n();

  const menuItems = [
    {
      icon: Sparkles,
      label: t("Sidebar.menu.Home"),
      link: "/home",
    },
    { icon: Rocket, label: t("Sidebar.menu.LaunchPad"), link: "/getting-started" },
    { icon: TowerControl, label: t("Sidebar.menu.MissionControl"), link: "/management" },
    { icon: Folder, label: t("Sidebar.menu.Projects"), link: "/projects" },
    { icon: Briefcase, label: t("Sidebar.menu.BusinessUnits"), link: "/business-units" },
    { icon: Users, label: t("Sidebar.menu.Entities"), link: "/entities" },
    // { icon: Activity, label: t("Sidebar.menu.Activity"), link: "/activity" },
    // { icon: Users, label: t("Sidebar.menu.Team"), link: "/team" },
    // { icon: Coins, label: t("Sidebar.menu.Tokens"), link: "/tokens" },
    // { icon: CreditCard, label: t("Sidebar.menu.Billing"), link: "/billing" },
    { icon: Landmark, label: t("Sidebar.menu.BankExtract"), link: "/extract" },
    { icon: ScrollText, label: t("Sidebar.menu.PaymentRequest"), link: "/payment-requests" },
  ];

  const bottomItems = [
    { icon: Settings, label: t("Sidebar.bottom.Settings"), link: "/settings" },
    { icon: LogOut, label: t("Sidebar.bottom.LogOut"), action: "logout" },
  ];

  return (
    <>
      {/* MOBILE MENU BUTTON */}
      <div className="lg:hidden p-4">
        <MobileSidebar
          menuItems={menuItems}
          bottomItems={bottomItems}
          router={router}
          pathname={pathname}
        />
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