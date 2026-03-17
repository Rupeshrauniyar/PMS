import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";

const THEMES = [
  {
    key: "light",
    title: "Light",
    description: "Clean white background with dark text.",
    Icon: Sun,
  },
  {
    key: "dark",
    title: "Dark",
    description: "Dark background with light text.",
    Icon: Moon,
  },
];

function applyTheme(theme) {
  const next = theme === "dark" ? "dark" : "light";
  localStorage.setItem("theme", next);
  document.documentElement.classList.toggle("dark", next === "dark");
  return next;
}

const Themes = () => {
  const navigate = useNavigate();
  const initial = useMemo(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" ? "dark" : "light";
  }, []);

  const [theme, setTheme] = useState(initial);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <div className="w-full min-h-screen bg-background text-foreground py-16">
      {/* Header */}
      <div className="border-b border-border bg-background sticky top-0 z-50">
        <div className="max-w-3xl mx-auto py-4 ">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-2xl font-bold">Themes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose how the app looks on your device.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto  py-6">
        {/* Toggle buttons */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-3">
          <div className="grid grid-cols-2 gap-2">
            {THEMES.map(({ key, title, description, Icon }) => {
              const selected = theme === key;
              return (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={[
                    "rounded-2xl border px-4 py-4 text-left transition-all",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    selected
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background hover:bg-accent hover:text-accent-foreground",
                  ].join(" ")}
                  aria-pressed={selected}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <span className="font-semibold">{title}</span>
                      </div>
                      <p
                        className={[
                          "mt-1 text-sm",
                          selected ? "text-background/80" : "text-muted-foreground",
                        ].join(" ")}
                      >
                        {description}
                      </p>
                    </div>
                    <div
                      className={[
                        "mt-1 h-4 w-4 rounded-full border",
                        selected
                          ? "border-background bg-background"
                          : "border-muted-foreground/40 bg-transparent",
                      ].join(" ")}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview */}
        {/* <div className="mt-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Preview</h2>
            <p className="text-sm text-muted-foreground">
              This is how components will look.
            </p>
          </div>
          <div className="p-5 space-y-4">
            <div className="rounded-xl border border-border bg-background px-4 py-3">
              <p className="font-medium">Card title</p>
              <p className="text-sm text-muted-foreground">
                Secondary text and subtle borders adapt to the selected theme.
              </p>
              <div className="mt-3 flex gap-2">
                <button className="rounded-lg bg-foreground px-3 py-2 text-sm font-semibold text-background">
                  Primary
                </button>
                <button className="rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-accent">
                  Secondary
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">
                    Currently set to <span className="font-semibold">{theme}</span>
                  </p>
                </div>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-accent"
                >
                  Toggle
                </button>
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Themes;