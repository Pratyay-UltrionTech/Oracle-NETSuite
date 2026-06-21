import { LegalPageLayout } from '../../components/layout/LegalPageLayout';

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <p className="text-[#666] text-[12px]">Last updated: {new Date().getFullYear()}</p>

      <section>
        <h2 className="text-[15px] font-bold text-[#222] mb-2">Information we collect</h2>
        <p>
          We collect account information (name, email, role), form submissions, approval activity, and technical
          logs needed to operate and secure the service.
        </p>
      </section>

      <section>
        <h2 className="text-[15px] font-bold text-[#222] mb-2">How we use information</h2>
        <p>
          Data is used to authenticate users, process workflows, sync approved records to NetSuite, provide audit
          trails, and improve platform reliability.
        </p>
      </section>

      <section>
        <h2 className="text-[15px] font-bold text-[#222] mb-2">Storage &amp; security</h2>
        <p>
          Credentials are stored using industry-standard hashing. Access is restricted by role. Transmission uses
          encrypted connections in production environments.
        </p>
      </section>

      <section>
        <h2 className="text-[15px] font-bold text-[#222] mb-2">Sharing</h2>
        <p>
          We do not sell personal data. Information is shared only with your organization, integrated systems
          (such as NetSuite), and infrastructure providers required to host the application.
        </p>
      </section>

      <section>
        <h2 className="text-[15px] font-bold text-[#222] mb-2">Your rights</h2>
        <p>
          Contact your organization administrator to request access corrections, account deactivation, or
          clarification on how your company processes employee data through this platform.
        </p>
      </section>
    </LegalPageLayout>
  );
}
