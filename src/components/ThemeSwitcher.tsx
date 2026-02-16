"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Moon, Sun, Monitor } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

type Theme = "light" | "dark" | "system";

export function ThemeSwitcher() {
    const { t } = useI18n();
    const [theme, setTheme] = useState<Theme>("system");
    const [isMounted, setIsMounted] = useState(false);

    const applyTheme = (newTheme: Theme) => {
        const root = document.documentElement;

        if (newTheme === "dark") {
            root.classList.add("dark");
        } else if (newTheme === "light") {
            root.classList.remove("dark");
        } else {
            // System preference
            const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            if (systemPrefersDark) {
                root.classList.add("dark");
            } else {
                root.classList.remove("dark");
            }
        }
    };

    // Only render on client to avoid hydration mismatch
    useEffect(() => {
        // eslint-disable-next-line
        setIsMounted(true);

        // Get saved theme from localStorage
        const savedTheme = localStorage.getItem("theme") as Theme | null;
        if (savedTheme) {
            setTheme(savedTheme);
            applyTheme(savedTheme);
        } else {
            applyTheme("system");
        }
    }, []);

    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        applyTheme(newTheme);
    };

    const getThemeIcon = (themeValue: Theme) => {
        switch (themeValue) {
            case "light":
                return <Sun className="w-4 h-4" />;
            case "dark":
                return <Moon className="w-4 h-4" />;
            case "system":
                return <Monitor className="w-4 h-4" />;
        }
    };

    const getThemeLabel = (themeValue: Theme) => {
        switch (themeValue) {
            case "light":
                return t("Settings.General.themeLight");
            case "dark":
                return t("Settings.General.themeDark");
            case "system":
                return t("Settings.General.themeSystem");
        }
    };

    if (!isMounted) {
        return (
            <div className="flex items-center gap-2">
                {getThemeIcon(theme)}
                <div className="w-[140px] h-9 rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                    {getThemeLabel(theme)}
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            {getThemeIcon(theme)}
            <Select value={theme} onValueChange={handleThemeChange}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="light">
                        <div className="flex items-center gap-2">
                            <Sun className="w-4 h-4" />
                            {t("Settings.General.themeLight")}
                        </div>
                    </SelectItem>
                    <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                            <Moon className="w-4 h-4" />
                            {t("Settings.General.themeDark")}
                        </div>
                    </SelectItem>
                    <SelectItem value="system">
                        <div className="flex items-center gap-2">
                            <Monitor className="w-4 h-4" />
                            {t("Settings.General.themeSystem")}
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
