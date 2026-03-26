"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Sparkles,
  Folder,
  Rocket,
  TowerControl,
  CreditCard,
  Settings,
  Landmark,
  ScrollText,
  LogOut,
  Menu,
  Briefcase,
  GitBranch,
  Users,
  Wallet,
  LayoutGrid
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
    { icon: TowerControl, label: t("Sidebar.menu.MissionControl"), link: "/management", permission: "tenant:view" },
    { icon: Folder, label: t("Sidebar.menu.Projects"), link: "/projects", permission: "projects:view" },
    { icon: Briefcase, label: t("Sidebar.menu.BusinessUnits"), link: "/business-units", permission: "entities:view" },
    { icon: Users, label: t("Sidebar.menu.Entities"), link: "/entities", permission: "entities:view" },
    { icon: Landmark, label: t("Sidebar.menu.BankExtract"), link: "/extract", permission: "banks:view" },
    {
      icon: CreditCard,
      label: t("Sidebar.menu.OutflowManagement"),
      link: "/outflow-management",
      permission: "payment_req:view",
      children: [
        {
          icon: ScrollText,
          label: t("Sidebar.menu.PurchaseOrder"),
          link: "/purchase-orders",
          permission: "payment_req:view",
        },
        {
          icon: ScrollText,
          label: t("Sidebar.menu.PaymentRequest"),
          link: "/payment-requests",
          permission: "payment_req:view",
        },
        {
          icon: Wallet,
          label: t("Sidebar.menu.CashRequests"),
          link: "/cash-requests",
          permission: "payment_req:view",
        },
        {
          icon: GitBranch,
          label: t("Sidebar.menu.Workflows"),
          link: "/workflows",
          permission: "roles:view",
        },
      ],
    },
  ];

  const bottomItems = [
    { icon: LayoutGrid, label: "Cambiar Workspace", link: "/select-workspace" },
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