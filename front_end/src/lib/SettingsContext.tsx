// src/lib/SettingsContext.tsx
import { createContext, useContext, useMemo, useState } from "react";
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from "./settings";

type Ctx = {
  settings: Settings;
  setSettings: (s: Settings) => void;
  update: (partial: Partial<Settings>) => void;
};

const SettingsCtx = createContext<Ctx>({
  settings: DEFAULT_SETTINGS,
  setSettings: () => {},
  update: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(() => loadSettings());

  const setSettings = (s: Settings) => {
    setSettingsState(s);
    saveSettings(s);
  };

  const update = (partial: Partial<Settings>) => {
    const next: Settings = {
      thresholds: { ...settings.thresholds, ...(partial.thresholds || {}) },
      polling: { ...settings.polling, ...(partial.polling || {}) },
    };
    setSettings(next);
  };

  const value = useMemo(() => ({ settings, setSettings, update }), [settings]);
  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
}

export function useSettings() {
  return useContext(SettingsCtx);
}
