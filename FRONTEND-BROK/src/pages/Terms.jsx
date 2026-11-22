import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const SECTIONS = [
  {
    title: "1. Broker Eligibility & Conduct",
    body: "Propatyc Broker Console is restricted to authorized brokers and superbrokers coordinating verified property site visits. Brokers agree to represent listings accurately and treat buyers and property owners respectfully.",
  },
  {
    title: "2. Open Pool & Claiming Visits",
    body: "Visit requests appear in the Open Pool only after the property owner approves them. When you claim a visit, you commit to contacting both parties promptly and scheduling a confirmed 3-way meeting.",
  },
  {
    title: "3. Confidentiality of Contact Details",
    body: "Buyer and property owner phone numbers and email addresses unlocked upon claiming a visit may be used solely for coordinating the Propatyc site visit and may not be shared or repurposed outside the platform.",
  },
  {
    title: "4. Scheduling, Releases & Cancellations",
    body: "If you cannot conduct a claimed visit, release it back to the Open Pool promptly so another broker can assist. Outcomes (completed or no-show) must be recorded truthfully after the scheduled start window.",
  },
  {
    title: "5. Account Security & Termination",
    body: "You are responsible for safeguarding your broker credentials. Propatyc may suspend or revoke broker or superbroker access for misuse of client data, repeated unannounced no-shows, or policy violations.",
  },
];

export default function Terms() {
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
            Terms &amp; Conditions
          </h1>
          <p className="text-xs text-muted-foreground">
            Propatyc Broker Portal · Updated 2026
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-5 text-brand" aria-hidden="true" />
            <span>Propatyc Broker Service Agreement</span>
          </CardTitle>
          <CardDescription>
            These terms govern your access to and use of the Propatyc Broker Site Visit Console.
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
