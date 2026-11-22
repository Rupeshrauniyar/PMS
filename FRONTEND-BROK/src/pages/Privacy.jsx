import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: "We collect your broker profile details (name, email, phone number, profile photo), visit coordination logs (claims, schedules, meeting points, outcome notes), and optional push notification tokens when enabled on mobile devices.",
  },
  {
    title: "2. How Your Information Is Used",
    body: "Your name, phone number, and email are shared with the buyer and property owner of visits assigned to you so all three parties can coordinate on site visit day. Activity logs power real-time status tracking and superbroker oversight.",
  },
  {
    title: "3. Client Data Protection",
    body: "Unclaimed pool requests conceal buyer and owner phone numbers. Contact details become visible only to the assigned broker (and authorized superbrokers) for active visit coordination.",
  },
  {
    title: "4. Push Notifications & Device Permissions",
    body: "On Android/iOS builds, push notification tokens are registered only when permission is granted and cleared automatically when you sign out.",
  },
  {
    title: "5. Your Choices",
    body: "You can update your broker name and phone number anytime from Profile, opt out of device push notifications in system settings, or contact Propatyc support for account deletion.",
  },
];

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Back</span>
        </Button>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
            Privacy Policy
          </h1>
          <p className="text-xs text-muted-foreground">
            Propatyc Broker Portal · Updated 2026
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5 text-brand" aria-hidden="true" />
            <span>How Propatyc Protects Broker &amp; Client Data</span>
          </CardTitle>
          <CardDescription>
            Transparency on data collection, contact visibility, and security inside the Broker Console.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 text-sm leading-relaxed">
          {SECTIONS.map((s) => (
            <section key={s.title} className="space-y-1.5">
              <h2 className="text-base font-bold text-foreground">{s.title}</h2>
              <p className="text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
