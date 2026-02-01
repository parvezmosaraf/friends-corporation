import { useState, useEffect } from "react";

/** BeforeInstallPromptEvent is not in all TS libs */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function useInstallPWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installable, setInstallable] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setInstallable(true);
    };

    if (typeof window === "undefined") return;

    // Already running as installed PWA
    const standalone = (window as Window & { standalone?: boolean }).standalone ?? window.matchMedia("(display-mode: standalone)").matches;
    if (standalone) {
      setInstalled(true);
      return;
    }

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return false;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
    setInstallable(false);
    return outcome === "accepted";
  };

  return { installable, installed, promptInstall };
}
