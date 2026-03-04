"use client";

import { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import SidebarContent from "./SidebarContent";

export default function MobileSidebar({
    menuItems,
    bottomItems,
    router,
    pathname,
}: any) {
    const [open, setOpen] = useState(false);

    return (
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
    );
}
