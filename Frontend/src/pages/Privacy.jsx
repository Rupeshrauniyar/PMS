import React from "react";

const Privacy = () => {
  const lastUpdated = "Jan 2026";

  return (
    <div className="mx-auto w-full max-w-4xl  py-16">
      <div className="border-b border-zinc-200  py-5">
        <h1 className="text-2xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Last updated: {lastUpdated}
        </p>
      </div>

      <div className=" py-6">
        <div className="prose prose-zinc max-w-none">
          <p>
            This Privacy Policy explains how we collect, use, share, and protect
            your information when you use this application and its related
            services (&ldquo;App&rdquo;).
          </p>

          <h2>1. Information We Collect</h2>
          <ul>
            <li>
              <strong>Account information</strong>: name/username, email, phone
              number, and profile photo (if provided).
            </li>
            <li>
              <strong>Property and booking data</strong>: listings you create,
              saved properties, booking requests, and related messages/notes.
            </li>
            <li>
              <strong>Device and usage data</strong>: app interactions, basic
              diagnostics, device identifiers, and log data for security and
              performance.
            </li>
            <li>
              <strong>Notifications</strong>: if you enable push notifications,
              we store notification tokens to send relevant updates.
            </li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>To operate and improve the App and its features.</li>
            <li>
              To authenticate users, maintain accounts, and prevent fraud.
            </li>
            <li>
              To enable property listing, saving, booking requests, and
              confirmations.
            </li>
            <li>
              To send service-related messages and push notifications (when
              enabled).
            </li>
            <li>To comply with legal obligations.</li>
          </ul>

          <h2>3. How We Share Information</h2>
          <p>
            We do not sell your personal information. We may share data in the
            following cases:
          </p>
          <ul>
            <li>
              <strong>With other users</strong>: when you interact with listings
              and bookings (e.g., a property owner may see your booking request
              details).
            </li>
            <li>
              <strong>With service providers</strong>: hosting, analytics,
              notifications, authentication, and other vendors that help us run
              the App.
            </li>
            <li>
              <strong>For legal reasons</strong>: to comply with law, enforce
              our terms, or protect rights and safety.
            </li>
          </ul>

          <h2>4. Data Retention</h2>
          <p>
            We keep your information only as long as necessary to provide the
            service, comply with legal obligations, resolve disputes, and
            enforce agreements.
          </p>

          <h2>5. Security</h2>
          <p>
            We use reasonable security measures to protect your data. However,
            no method of transmission or storage is 100% secure.
          </p>

          <h2>6. Your Choices</h2>
          <ul>
            <li>
              You can update your profile information from within the App.
            </li>
            <li>You can opt out of push notifications via device settings.</li>
            <li>
              You may request account deletion via the support options in the
              App (subject to legal retention requirements).
            </li>
          </ul>

          <h2>7. Children&rsquo;s Privacy</h2>
          <p>
            The App is not intended for children under 13 (or the minimum age
            required in your country). We do not knowingly collect data from
            children.
          </p>

          <h2>8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will post
            the updated policy here with a new &ldquo;Last updated&rdquo; date.
          </p>

          <h2>9. Contact</h2>
          <p>
            If you have questions about this Privacy Policy, contact us through
            the support options available in the App.
          </p>
        </div>

        <div className="mt-8 rounded-xl border border-zinc-900 bg-zinc-900 px-4 py-3">
          <p className="text-sm text-white">
            We respect your privacy and use your data only to provide and
            improve the service.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
