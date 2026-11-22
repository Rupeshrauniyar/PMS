import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Moon, Sun, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  {
    key: "light",
    title: "Light",
    description: "Warm, crisp daylight surfaces with high readability.",
    icon: Sun,
  },
  {
    key: "dark",
    title: "Dark",
    description: "Comfortable low-glare dark surfaces for evening browsing.",
    icon: Moon,
  },
];

const Themes = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-5 sm:py-8">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="-ml-2 mb-1 gap-1.5"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span>Back</span>
        </Button>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Appearance
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Choose how Propatyc looks across your device.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {THEME_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const selected = theme === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setTheme(opt.key)}
              aria-pressed={selected}
              className={cn(
                "flex flex-col items-start justify-between gap-4 rounded-3xl border p-5 text-left transition-all",
                selected
                  ? "border-brand bg-brand-soft/60 ring-2 ring-brand/20 shadow-soft"
                  : "border-border/80 bg-card hover:border-foreground/25",
              )}
            >
              <div className="flex w-full items-center justify-between">
                <div
                  className={cn(
                    "flex size-11 items-center justify-center rounded-2xl",
                    selected
                      ? "bg-brand text-brand-foreground"
                      : "bg-secondary text-foreground",
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                {selected ? (
                  <CheckCircle2 className="size-5 text-brand" aria-hidden="true" />
                ) : null}
              </div>

              <div>
                <p className="text-base font-bold text-foreground">{opt.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {opt.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
          <CardDescription>
            Surfaces, badges, and buttons adapt seamlessly to your selected theme.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand">Video Tour</Badge>
            <Badge variant="success">Scheduled</Badge>
            <Badge variant="info">Finding a broker</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="brand" size="sm">
              Primary Action
            </Button>
            <Button variant="outline" size="sm">
              Secondary
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Themes;
