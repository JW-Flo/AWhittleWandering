import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/layout/Footer";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="sm" />
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 16, 2024</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Agreement to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using A Whittle Wandering ("AWW," "we," "us," or "our") at awhittlewandering.com, 
              you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not 
              use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              AWW provides a platform for tracking, documenting, and sharing vehicle adventures and road trips. 
              Our services include journey tracking, route visualization, analytics dashboards, photo galleries, 
              and social sharing features. We integrate with third-party vehicle APIs (such as Tessie for Tesla 
              vehicles) to provide real-time vehicle data and telemetry.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Accounts</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                <strong className="text-foreground">3.1 Account Creation:</strong> You must create an account to access 
                certain features. You agree to provide accurate, current, and complete information during registration.
              </p>
              <p>
                <strong className="text-foreground">3.2 Account Security:</strong> You are responsible for maintaining 
                the confidentiality of your account credentials and for all activities under your account.
              </p>
              <p>
                <strong className="text-foreground">3.3 Age Requirement:</strong> You must be at least 18 years old 
                to create an account and use our services.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">You agree NOT to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Use the service for any illegal purpose or in violation of any laws</li>
              <li>Share content that is defamatory, obscene, or infringes on others' rights</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
              <li>Use automated systems (bots, scrapers) to access the service without permission</li>
              <li>Interfere with or disrupt the service or servers</li>
              <li>Share false or misleading journey data</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Use the platform to stalk or track individuals without their consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. User Content</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                <strong className="text-foreground">5.1 Ownership:</strong> You retain ownership of content you upload 
                (photos, journal entries, route data). By uploading content, you grant AWW a non-exclusive, worldwide, 
                royalty-free license to use, display, and distribute your content in connection with the service.
              </p>
              <p>
                <strong className="text-foreground">5.2 Responsibility:</strong> You are solely responsible for content 
                you upload and share. Do not upload content you don't have rights to share.
              </p>
              <p>
                <strong className="text-foreground">5.3 Removal:</strong> We reserve the right to remove content that 
                violates these terms or is otherwise objectionable.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Third-Party Integrations</h2>
            <p className="text-muted-foreground leading-relaxed">
              AWW integrates with third-party services including vehicle APIs (Tessie, Tesla Fleet API), mapping 
              services (Mapbox), and notification services (Twilio, Resend). Your use of these integrations is 
              subject to their respective terms of service. We are not responsible for the availability, accuracy, 
              or performance of third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your privacy is important to us. Please review our{" "}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> to understand 
              how we collect, use, and protect your information, including location data and vehicle telemetry.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. 
              WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. VEHICLE DATA AND 
              ANALYTICS ARE PROVIDED FOR INFORMATIONAL PURPOSES ONLY AND SHOULD NOT BE RELIED UPON FOR SAFETY-CRITICAL 
              DECISIONS.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, AWW SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
              CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT 
              EXCEED THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify and hold harmless AWW and its officers, directors, employees, and agents from 
              any claims, damages, losses, or expenses arising from your use of the service, violation of these terms, 
              or infringement of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Modifications to Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify, suspend, or discontinue the service (or any part thereof) at any time 
              with or without notice. We shall not be liable to you or any third party for any modification, 
              suspension, or discontinuance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms of Service from time to time. We will notify you of material changes by 
              posting the new terms on this page and updating the "Last updated" date. Your continued use of the 
              service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">13. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms shall be governed by and construed in accordance with the laws of the State of Texas, 
              United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">14. Dispute Resolution</h2>
            <p className="text-muted-foreground leading-relaxed">
              Any disputes arising from these terms or your use of the service shall first be attempted to be 
              resolved through good-faith negotiation. If negotiation fails, disputes shall be resolved through 
              binding arbitration in accordance with the rules of the American Arbitration Association.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">15. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms of Service, please contact us at:{" "}
              <a href="mailto:legal@awhittlewandering.com" className="text-primary hover:underline">
                legal@awhittlewandering.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer variant="minimal" />
    </div>
  );
};

export default Terms;
