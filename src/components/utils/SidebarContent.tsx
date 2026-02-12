"use client";

import {
    ChevronLeft,
    ChevronRight,
    Sparkles,
} from "lucide-react";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Swal from "sweetalert2";

export default function SidebarContent({
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
