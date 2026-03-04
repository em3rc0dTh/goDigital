"use client";

import { createContext, useContext, useState } from "react";
import es from "./es.json";
import en from "./en.json";

type Locale = "es" | "en";

const messages = { es, en };

const I18nContext = createContext<{
    locale: Locale;
    t: (key: string, vars?: Record<string, string | number>) => string;
    setLocale: (l: Locale) => void;
} | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocale] = useState<Locale>("es");

    const t = (path: string, vars?: Record<string, string | number>) => {
        let value = path
            .split(".")
            .reduce((obj: any, key) => obj?.[key], messages[locale]);

        if (value === undefined) {
            console.warn(`Missing translation for key: ${path} in locale: ${locale}`);
            // console.log("Current messages state:", messages[locale]);
        }


        if (value === undefined && locale !== 'en') {
            console.warn(`Missing translation for key: ${path} in locale: ${locale}. Falling back to en.`);
            value = path.split(".").reduce((obj: any, key) => obj?.[key], messages['en']);
        }

        let text = typeof value === "string" ? value : path;

        if (vars) {
            Object.entries(vars).forEach(([k, v]) => {
                text = text.replace(`{${k}}`, String(v));
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
