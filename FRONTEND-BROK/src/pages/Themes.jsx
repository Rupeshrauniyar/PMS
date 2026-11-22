import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Monitor, Moon, Sun, CheckCircle2 } from "lucide-react";

import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const OPTIONS = [
  {
    key: "system",
    title: "System Default",
    description: "Automatically follows your device's light or dark appearance.",
    icon: Monitor,
  },
  {
    key: "light",
    title: "Light Mode",
    description: "Crisp daylight palette ideal for bright outdoor site visits.",
    icon: Sun,
  },
  {
    key: "dark",
    title: "Dark Mode",
    description: "Low-glare dark interface comfortable for evening coordination.",
    icon: Moon,
  },
];

export default function Themes() {
  const navigate = useNavigate();
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Back</span>
        </Button>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
            Appearance &amp; Theme
          </h1>
          <p className="text-xs text-muted-foreground">
            Choose how Propatyc Broker Console looks on this device
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Color Scheme</CardTitle>
              <CardDescription>
                Active rendering: <strong className="capitalize text-foreground">{resolvedTheme}</strong>
              </CardDescription>
            </div>
            <Badge variant="brand" className="capitalize">
              {theme}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const selected = theme === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setTheme(opt.key)}
                aria-pressed={selected}
                className={cn(
                  "flex flex-col justify-between gap-4 rounded-2xl border p-4 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  selected
                    ? "border-brand bg-brand-soft/55 shadow-soft"
                    : "border-border/75 bg-background/60 hover:bg-accent",
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl",
                      selected ? "bg-brand text-brand-foreground" : "bg-muted text-foreground",
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  {selected ? (
                    <CheckCircle2 className="size-5 text-brand" aria-hidden="true" />
                  ) : null}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{opt.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
