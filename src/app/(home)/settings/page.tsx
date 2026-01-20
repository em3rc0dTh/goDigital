"use client";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/i18n/I18nProvider";

export default function Settings() {
    const { t } = useI18n();

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">{t("Settings.General.title")}</h1>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm max-w-md">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">
                            {t("Settings.General.language")}
                        </label>
                        <LanguageSwitcher />
                    </div>
                </div>
            </div>
        </div>
    );
}