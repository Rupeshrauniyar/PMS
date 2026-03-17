import React from "react";

const Terms = () => {
  const lastUpdated = "Jan 2026";

  return (
    <div className="mx-auto w-full max-w-4xl  py-16">
      <div className="border-b border-zinc-200  py-5">
        <h1 className="text-2xl font-bold tracking-tight">
          Terms &amp; Conditions
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Last updated: {lastUpdated}
        </p>
      </div>

      <div className=" py-6">
        <div className="prose prose-zinc max-w-none">
          <p>
            These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your
            access to and use of this application and related services
            (&ldquo;App&rdquo;). By using the App, you agree to these Terms.
          </p>

          <h2>1. Eligibility</h2>
          <p>
            You must be able to form a binding contract and comply with all
            applicable laws. If you are using the App on behalf of an
            organization, you represent that you have authority to bind that
            organization.
          </p>

          <h2>2. Account &amp; Security</h2>
          <ul>
            <li>
              You are responsible for maintaining the confidentiality of your
              login credentials and for all activity under your account.
            </li>
            <li>You agree to provide accurate and up-to-date information.</li>
          </ul>

          <h2>3. Listings, Bookings &amp; Payments</h2>
          <ul>
            <li>
              Property information (pricing, availability, images, descriptions)
              is provided by owners/agents and may change.
            </li>
            <li>
              Booking requests may require owner confirmation. The App may
              record booking status (e.g., pending/confirmed/cancelled).
            </li>
            <li>
              If payments are supported, fees, refunds, and payment timing will
              depend on the specific flow shown in the App at checkout or
              booking time.
            </li>
          </ul>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the App for unlawful, harmful, or abusive purposes.</li>
            <li>
              Post or transmit false, misleading, infringing, or offensive
              content.
            </li>
            <li>
              Attempt to interfere with the App, probe its security, or access
              data you are not authorized to access.
            </li>
          </ul>

          <h2>5. Content &amp; Intellectual Property</h2>
          <ul>
            <li>
              The App and its original content, features, and functionality are
              owned by the App operator and are protected by applicable laws.
            </li>
            <li>
              You retain ownership of content you submit, but you grant the App
              a limited license to host, store, and display it for the purpose
              of operating the service.
            </li>
          </ul>

          <h2>6. Third-Party Services</h2>
          <p>
            The App may integrate third-party services (e.g., authentication,
            maps, analytics, notifications, payment providers). Their terms and
            policies may apply.
          </p>

          <h2>7. Disclaimers</h2>
          <p>
            The App is provided on an &ldquo;as is&rdquo; and &ldquo;as
            available&rdquo; basis. We do not guarantee that the App will be
            uninterrupted, secure, or error-free, or that listings will be
            accurate or available at all times.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, we are not liable for
            indirect, incidental, special, consequential, or punitive damages,
            or any loss of profits, data, or goodwill arising from your use of
            the App.
          </p>

          <h2>9. Termination</h2>
          <p>
            We may suspend or terminate your access if you violate these Terms
            or if required to do so by law. You may stop using the App at any
            time.
          </p>

          <h2>10. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of the
            App after changes means you accept the updated Terms.
          </p>

          <h2>11. Contact</h2>
          <p>
            If you have questions about these Terms, contact us through the
            support options available in the App.
          </p>
        </div>

        <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <p className="text-sm text-zinc-700">
            By continuing to use the App, you acknowledge that you have read and
            agree to these Terms.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
