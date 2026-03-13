"use client";

import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Sparkles,
} from "lucide-react";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Swal from "sweetalert2";
import { useState } from "react";

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

    // Track which parent items are open. Initialise open if a child is active.
    const [openItems, setOpenItems] = useState<Record<number, boolean>>(() => {
        const initial: Record<number, boolean> = {};
        menuItems.forEach((item: any, index: number) => {
            if (item.children?.some((child: any) => pathname.startsWith(child.link))) {
                initial[index] = true;
            }
        });
        return initial;
    });

    const toggleOpen = (index: number) => {
        setOpenItems((prev) => ({ ...prev, [index]: !prev[index] }));
    };

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
                    const hasChildren = item.children && item.children.length > 0;
                    const isOpen = openItems[index] ?? false;

                    // Parent is "active" if its own link matches OR any child link matches
                    const isActive = hasChildren
                        ? item.children.some((child: any) => pathname.startsWith(child.link)) ||
                        (item.link === "/" ? pathname === "/" : pathname.startsWith(item.link))
                        : item.link === "/"
                            ? pathname === "/"
                            : pathname.startsWith(item.link);

                    return (
                        <div key={index}>
                            <Button
                                variant={isActive && !hasChildren ? "secondary" : isActive ? "secondary" : "ghost"}
                                className={`w-full justify-start gap-3 mb-1 ${collapsed ? "px-2" : "px-3"}`}
                                onClick={() => {
                                    if (hasChildren) {
                                        // If collapsed, expand sidebar first then open
                                        if (collapsed) {
                                            setCollapsed(false);
                                            setOpenItems((prev) => ({ ...prev, [index]: true }));
                                            return;
                                        }
                                        toggleOpen(index);
                                        // Also navigate to parent page if it has a link
                                        if (item.link) {
                                            router.push(item.link);
                                            // do not close mobile menu here so user can see/click subitems
                                        }
                                    } else {
                                        router.push(item.link);
                                        if (closeMobileMenu) closeMobileMenu();
                                    }
                                }}
                            >
                                <item.icon className="w-5 h-5 shrink-0" />
                                {!collapsed && (
                                    <>
                                        <span className="flex-1 text-left">{item.label}</span>
                                        {hasChildren && (
                                            <ChevronDown
                                                className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                                                    }`}
                                            />
                                        )}
                                    </>
                                )}
                            </Button>

                            {/* CHILDREN */}
                            {hasChildren && !collapsed && isOpen && (
                                <div className="ml-4 pl-3 border-l border-border mb-1">
                                    {item.children.map((child: any, childIndex: number) => {
                                        const isChildActive = pathname.startsWith(child.link);
                                        return (
                                            <Button
                                                key={childIndex}
                                                variant={isChildActive ? "secondary" : "ghost"}
                                                className="w-full justify-start gap-3 mb-1 px-3"
                                                onClick={() => {
                                                    router.push(child.link);
                                                    if (closeMobileMenu) closeMobileMenu();
                                                }}
                                            >
                                                <child.icon className="w-4 h-4 shrink-0" />
                                                <span className="text-sm">{child.label}</span>
                                            </Button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
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
                        className={`w-full justify-start gap-3 mb-1 ${collapsed ? "px-2" : "px-3"}`}
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