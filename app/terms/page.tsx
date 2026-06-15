"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground rtl-flip" />
            </Link>
            <h1 className="text-xl font-bold text-foreground">Terms of Service</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <p className="text-muted-foreground mb-8">
          Last updated: April 7, 2026
        </p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground mb-4">
              By accessing or using Qantara, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Use License</h2>
            <p className="text-muted-foreground mb-4">
              Permission is granted to temporarily access and use Qantara for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
            </p>
            <p className="text-muted-foreground mb-4">Under this license you may not:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose</li>
              <li>Attempt to decompile or reverse engineer any software</li>
              <li>Remove any copyright or proprietary notations</li>
              <li>Transfer the materials to another person</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Service Provider Terms</h2>
            <p className="text-muted-foreground mb-4">
              Service providers on our platform must:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Provide accurate professional credentials for verification</li>
              <li>Maintain valid licenses and certifications as required by law</li>
              <li>Deliver services as described in their listings</li>
              <li>Respond to booking requests in a timely manner</li>
              <li>Maintain professional conduct with all clients</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Consumer Terms</h2>
            <p className="text-muted-foreground mb-4">
              Consumers using our platform agree to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Provide accurate personal information</li>
              <li>Honor confirmed bookings or cancel within the allowed timeframe</li>
              <li>Make payments for services rendered</li>
              <li>Provide honest and fair reviews</li>
              <li>Treat service providers with respect</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Payment Terms</h2>
            <p className="text-muted-foreground mb-4">
              All payments are processed securely through our payment partners. Service fees are non-refundable unless otherwise stated. Refunds for cancelled services follow individual provider cancellation policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Disclaimer</h2>
            <p className="text-muted-foreground mb-4">
              The materials on Qantara are provided on an &apos;as is&apos; basis. Qantara makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Limitations</h2>
            <p className="text-muted-foreground mb-4">
              In no event shall Qantara or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Qantara.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Privacy</h2>
            <p className="text-muted-foreground mb-4">
              Your privacy is important to us. Please review our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              {" "}to understand how we collect, use, and protect your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Modifications</h2>
            <p className="text-muted-foreground mb-4">
              Qantara may revise these terms of service at any time without notice. By using this platform you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms, please contact us at{" "}
              <a href="mailto:legal@qantara.com" className="text-primary hover:underline">
                legal@qantara.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
