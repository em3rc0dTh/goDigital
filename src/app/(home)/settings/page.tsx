"use client";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/i18n/I18nProvider";

export default function Settings() {
    const { t } = useI18n();

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto p-6 sm:p-8 lg:p-12">
                {/* Header Section */}
                <div className="mb-8 pb-6 border-b border-gray-200">
                    <h1 className="text-3xl font-semibold text-gray-900 mb-1">
                        {t("Settings.General.title")}
                    </h1>
                    <p className="text-gray-600 text-sm">
                        {t("Settings.General.description")}
                    </p>
                </div>

                {/* Settings Sections */}
                <div className="space-y-8">
                    {/* Language Setting */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-900 block">
                            {t("Settings.General.language")}
                        </label>
                        <p className="text-sm text-gray-500">
                            {t("Settings.General.languageDescription")}
                        </p>
                        <div className="pt-2">
                            <LanguageSwitcher />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200"></div>

                    {/* Theme Setting (Placeholder) */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-400 block">
                            {t("Settings.General.theme")}
                        </label>
                        <p className="text-sm text-gray-400">
                            {t("Settings.General.themeDescription")}
                        </p>
                        <div className="pt-2">
                            <div className="text-sm text-gray-400 bg-gray-50 px-4 py-3 rounded-md border border-gray-200">
                                {t("Settings.General.comingSoon")}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}