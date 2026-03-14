import React, { createContext, useContext, useMemo, useState } from "react";

type LanguageCode = "en" | "ar";

type LanguageContextValue = {
  language: LanguageCode;
  toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

export const LanguageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [language, setLanguage] = useState<LanguageCode>("en");

  const value = useMemo(
    () => ({
      language,
      toggleLanguage: () =>
        setLanguage((prev) => (prev === "en" ? "ar" : "en")),
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
};

