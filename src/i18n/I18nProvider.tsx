"use client";

import { createContext, useContext, useState } from "react";
import es from "./es.json";
import en from "./en.json";

type Locale = "es" | "en";

const messages = { es, en };

const I18nContext = createContext<{
    locale: Locale;
    t: (key: string) => string;
    setLocale: (l: Locale) => void;
} | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocale] = useState<Locale>("es");

    const t = (path: string, vars?: Record<string, string>) => {
        const value = path
            .split(".")
            .reduce((obj: any, key) => obj?.[key], messages[locale]);

        let text = typeof value === "string" ? value : path;

        if (vars) {
            Object.entries(vars).forEach(([k, v]) => {
                text = text.replace(`{${k}}`, v);
            });
        }

        return text;
    };


    return (
        <I18nContext.Provider value={{ locale, t, setLocale }}>
            {children}
        </I18nContext.Provider>
    );
}

export const useI18n = () => {
    const ctx = useContext(I18nContext);
    if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
    return ctx;
};
