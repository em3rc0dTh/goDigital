"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
    const { locale, setLocale, t } = useI18n();

    return (
        <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <Select value={locale} onValueChange={(v: "en" | "es") => setLocale(v)}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder={t("Settings.General.language")} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="en">{t("Settings.General.english")}</SelectItem>
                    <SelectItem value="es">{t("Settings.General.spanish")}</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
