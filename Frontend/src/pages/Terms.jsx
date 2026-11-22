import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const SECTIONS = [
  {
    title: "1. Eligibility",
    body: "You must be legally able to form a binding contract and comply with all applicable laws. If using Propatyc on behalf of an organization, you represent that you have authority to bind that organization.",
  },
  {
    title: "2. Account & Security",
    body: "You are responsible for safeguarding your login credentials and for all activity under your account. Keep your profile name and contact phone number accurate so site visits and reservations can be coordinated smoothly.",
  },
  {
    title: "3. Listings, Site Visits & Reservations",
    body: "Property details, photos, walkthrough videos, and pricing are provided by property owners and may change. Site visit requests follow a 3-party workflow (buyer request → owner approval → Propatyc broker scheduling). Direct payment reservations may require owner confirmation prior to checkout.",
  },
  {
    title: "4. Acceptable Use",
    body: "Do not upload misleading, unlawful, or infringing content, spam owners or brokers, or attempt to probe or disrupt platform security.",
  },
  {
    title: "5. Content & Intellectual Property",
    body: "You retain ownership of photos and videos you upload while granting Propatyc a limited license to host, optimize, and display them to operate the marketplace.",
  },
  {
    title: "6. Disclaimers & Limitation of Liability",
    body: "Propatyc is provided on an 'as is' and 'as available' basis. To the fullest extent permitted by law, Propatyc is not liable for indirect, incidental, or consequential damages arising from platform use.",
  },
];

const Terms = () => {
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
          <FileText className="size-5 text-brand" aria-hidden="true" />
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Terms &amp; Conditions
          </h1>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Last updated: 2026
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agreement to Terms</CardTitle>
          <CardDescription>
            These Terms govern your access to and use of Propatyc across web and mobile applications.
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

export default Terms;
