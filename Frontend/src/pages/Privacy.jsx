import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: "We collect account details (name, email, phone number, profile avatar), property listings (photos, walkthrough videos, descriptions), saved properties, site visit requests, and optional push notification tokens on mobile devices.",
  },
  {
    title: "2. How We Use Information",
    body: "Your data is used to operate the marketplace, authenticate your session, coordinate 3-party site visits between buyers, owners, and assigned brokers, process reservations, and deliver real-time status notifications.",
  },
  {
    title: "3. Contact Visibility & Sharing",
    body: "We never sell your personal information. During site visit coordination, buyer and owner contact details are shared only with the assigned Propatyc broker once claimed, and the assigned broker's contact details are shared with both buyer and owner.",
  },
  {
    title: "4. Security & Data Retention",
    body: "We use industry-standard safeguards including HttpOnly session cookies and encrypted transport. Data is retained only as long as needed to provide the service and comply with legal obligations.",
  },
  {
    title: "5. Your Controls",
    body: "You can edit your profile details, remove listings, cancel open visits, or disable device push notifications at any time.",
  },
];

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-5 sm:py-8">
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
        <div className="flex items-center gap-2.5">
          <Shield className="size-5 text-brand" aria-hidden="true" />
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Privacy Policy
          </h1>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Last updated: 2026
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How Propatyc Protects Your Privacy</CardTitle>
          <CardDescription>
            Transparency around what data we collect and how 3-party coordination keeps your contact details safe.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {SECTIONS.map((s) => (
            <section key={s.title} className="selectable flex flex-col gap-1.5">
              <h2 className="text-base font-bold text-foreground">{s.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </section>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Privacy;
