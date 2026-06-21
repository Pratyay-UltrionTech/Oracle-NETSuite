import { LegalPageLayout } from '../../components/layout/LegalPageLayout';

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Use">
      <p className="text-[#666] text-[12px]">Last updated: {new Date().getFullYear()}</p>

      <section>
        <h2 className="text-[15px] font-bold text-[#222] mb-2">1. Acceptance</h2>
        <p>
          By accessing or using Atisunya WebForm Builder, you agree to these Terms of Use. If you do not agree,
          do not sign in or use the service.
        </p>
      </section>

      <section>
        <h2 className="text-[15px] font-bold text-[#222] mb-2">2. Service description</h2>
        <p>
          The platform provides form design, approval workflows, and NetSuite integration for authorized users
          within your organization. Features and availability may change as the product evolves.
        </p>
      </section>

      <section>
        <h2 className="text-[15px] font-bold text-[#222] mb-2">3. Acceptable use</h2>
        <p>
          You must use the service lawfully, protect your credentials, and not attempt to disrupt, reverse engineer,
          or access data outside your assigned role and company scope.
        </p>
      </section>

      <section>
        <h2 className="text-[15px] font-bold text-[#222] mb-2">4. Data &amp; integrations</h2>
        <p>
          Submissions you create may be synced to NetSuite according to your organization&apos;s configuration.
          You are responsible for the accuracy of data entered into forms before approval and sync.
        </p>
      </section>

      <section>
        <h2 className="text-[15px] font-bold text-[#222] mb-2">5. Contact</h2>
        <p>
          For questions about these terms, contact your organization administrator or Atisunya Infotech support
          through your company&apos;s designated channel.
        </p>
      </section>
    </LegalPageLayout>
  );
}
