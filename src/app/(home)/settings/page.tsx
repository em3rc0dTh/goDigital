"use client";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useI18n } from "@/i18n/I18nProvider";

export default function Settings() {
    const { t } = useI18n();

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            <div className="max-w-3xl mx-auto p-6 sm:p-8 lg:p-12">
                {/* Header Section */}
                <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-800">
                    <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {t("Settings.General.title")}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {t("Settings.General.description")}
                    </p>
                </div>

                {/* Settings Sections */}
                <div className="space-y-8">
                    {/* Language Setting */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-900 dark:text-gray-100 block">
                            {t("Settings.General.language")}
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t("Settings.General.languageDescription")}
                        </p>
                        <div className="pt-2">
                            <LanguageSwitcher />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200 dark:border-gray-800"></div>

                    {/* Theme Setting */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-900 dark:text-gray-100 block">
                            {t("Settings.General.theme")}
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t("Settings.General.themeDescription")}
                        </p>
                        <div className="pt-2">
                            <ThemeSwitcher />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}