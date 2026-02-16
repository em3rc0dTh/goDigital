"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";
import { useEffect, useState } from "react";

export function LanguageSwitcher() {
    const { locale, setLocale, t } = useI18n();
    const [isMounted, setIsMounted] = useState(false);

    // Only render Select on client to avoid hydration mismatch
    useEffect(() => {
        // eslint-disable-next-line
        setIsMounted(true);
    }, []);

    return (
        <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            {isMounted ? (
                <Select value={locale} onValueChange={(v: "en" | "es") => setLocale(v)}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder={t("Settings.General.language")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="en">{t("Settings.General.english")}</SelectItem>
                        <SelectItem value="es">{t("Settings.General.spanish")}</SelectItem>
                    </SelectContent>
                </Select>
            ) : (
                <div className="w-[140px] h-9 rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                    {locale === "en" ? t("Settings.General.english") : t("Settings.General.spanish")}
                </div>
            )}
        </div>
    );
}
