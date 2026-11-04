import { useState } from "react";
import { Card, Button } from "../components/ui";
import { FileText, Shield, Scale, ArrowLeft } from "lucide-react";

type LegalPage = "menu" | "tos" | "privacy" | "eula";

const TOS_SECTIONS = [
  {
    title: "1. Acceptance of Terms & Contracting Parties",
    body: `By accessing, downloading, or using Poolr ("the Software"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, you may not access or use the Software. These Terms constitute a legally binding agreement between you and Muhammad Haris Awan (d/b/a "The Method Lab") ("Licensor", "we", "us", or "our").`,
  },
  {
    title: "2. Description of Service & Architecture",
    body: `Poolr is a high-performance desktop platform for conducting systematic reviews and meta-analyses (SRMA) compliant with PRISMA 2020 and Cochrane standards. The Software is architected with a local-first, Bring-Your-Own-Storage (BYOS) model: analytical computations run locally on your device, and cloud collaboration utilizes your own cloud storage (such as Google Drive) through direct client-to-cloud conduits.`,
  },
  {
    title: "3. License Grant & Restrictions",
    body: `Subject to your ongoing compliance with these Terms and any applicable license tier, Licensor grants you a limited, personal, non-exclusive, non-transferable, revocable license to install and use the Software on supported devices solely for your academic, clinical, or internal organizational evidence synthesis. You shall NOT: reverse engineer, decompile, disassemble, or extract proprietary algorithms; distribute, resell, lease, sublicense, or white-label the Software; or defeat any license gating or authentication checks.`,
  },
  {
    title: "4. Corporate Successor & Unilateral Assignment",
    body: `The Licensor currently operates as an individual proprietor doing business as "The Method Lab". Licensor expressly reserves the unilateral right, at any time without prior notice to or consent from any user, to transfer, assign, convey, or novate all rights, title, interests, trademarks, copyrights, and operational responsibilities in connection with the Software to any corporate entity, company, LLC, or partnership founded, organized, or controlled by Muhammad Haris Awan. All rights and protections under these Terms shall automatically inure to such corporate successor.`,
  },
  {
    title: "5. Unilateral Paid Plans, Feature Paywalling & No Grandfathering",
    body: `Licensor reserves the absolute, unilateral right at any time in its sole discretion, without liability or prior notice: (a) To introduce commercial paid subscription plans, seat-based licenses, usage tiers, and token-based billing; (b) To gate, restrict, paywall, or discontinue any feature, including cloud synchronization, Google Drive integration, multi-user real-time collaboration, automated AI extraction, or advanced Bayesian statistical engines; (c) To convert any feature provided free of charge or in preview into a paid-only feature. No user shall acquire any perpetual, vested, or grandfathered right to free or unmetered access to any part of the Software.`,
  },
  {
    title: "6. Bring-Your-Own-Storage (BYOS) & Google Drive Integration",
    body: `The Software allows users to link their Google Drive accounts via OAuth 2.0 to synchronize reviews and collaborate with invited team members. All files are stored directly in your Google Drive under a structured workspace folder ("Poolr Workspace/Projects/"). Licensor operates no intermediary servers, hosts no user reviews, and has no access to your Google credentials or project files. Licensor is not liable for any third-party service interruptions, Google API rate limits or quota exhaustion, data loss, or unauthorized access resulting from user sharing settings. You are solely responsible for maintaining backups of your research datasets.`,
  },
  {
    title: "7. Scientific, Academic & Medical Disclaimer",
    body: `THE SOFTWARE IS AN ANALYTICAL AND COMPUTATIONAL AID AND IS NOT A MEDICAL DEVICE. It does not provide clinical diagnoses, medical advice, treatment recommendations, or pharmaceutical efficacy determinations. All statistical outputs (pooled effect estimates, confidence intervals, heterogeneity measures, risk of bias assessments, and GRADE certainty levels) must be independently reviewed and verified by qualified human investigators before inclusion in publications, clinical guidelines, or health policy decisions. Licensor disclaims all liability for research retractions, publication disputes, or clinical consequences.`,
  },
  {
    title: "8. Intellectual Property & Trade Secrets",
    body: `The Software, including its compiled binaries, user interfaces, mathematical algorithms, export formats, logos, and documentation, is the exclusive proprietary property and trade secret of Muhammad Haris Awan. All rights not expressly granted are reserved.`,
  },
  {
    title: "9. Disclaimer of Warranties",
    body: `THE SOFTWARE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. LICENSOR DOES NOT GUARANTEE UNINTERRUPTED OR ERROR-FREE OPERATION.`,
  },
  {
    title: "10. Limitation of Liability",
    body: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE LICENSOR BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES (INCLUDING LOSS OF RESEARCH DATA, BUSINESS INTERRUPTION, LOSS OF REPUTATION, OR PUBLICATION DELAYS) ARISING OUT OF THE USE OF THE SOFTWARE. LICENSOR'S AGGREGATE LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU FOR THE SOFTWARE OR $10.00 USD, WHICHEVER IS GREATER.`,
  },
  {
    title: "11. Termination",
    body: `These Terms are effective until terminated. Your rights terminate automatically and immediately if you breach any provision. Upon termination, you must cease using the Software and destroy all copies in your possession.`,
  },
  {
    title: "12. Governing Law & Jurisdiction",
    body: `These Terms shall be governed by and construed in accordance with the laws of the Islamic Republic of Pakistan, without regard to conflict of law principles. Any dispute arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in Islamabad/Rawalpindi, Pakistan.`,
  },
  {
    title: "13. Contact Information",
    body: `For licensing, institutional agreements, or inquiries: Muhammad Haris Awan (d/b/a The Method Lab) · Email: m.harisawan@icloud.com · Repository: https://github.com/harisawan-bit/poolr`,
  },
];

const PRIVACY_SECTIONS = [
  {
    title: "1. Introduction",
    body: `This Privacy Policy explains how Poolr ("we", "us", "our") handles information when you use our desktop application. Poolr is designed with privacy as a core principle — your research data never leaves your computer unless you explicitly choose to share it.`,
  },
  {
    title: "2. Information We Collect",
    body: `Poolr operates entirely offline and does NOT collect, transmit, or store any personal information on external servers. All project data, screening decisions, extraction records, and analysis results are stored locally on your machine in standard JSON files. Optional features that require internet access (such as PubMed search or AI provider APIs) send queries only to those external services — not to us.`,
  },
  {
    title: "3. Local Storage",
    body: `The Software stores the following locally on your device: (a) Project metadata (review title, PICO parameters, objectives); (b) Screening decisions and conflict records; (c) Data extraction records; (d) Risk of bias assessments; (e) Meta-analysis configurations and results; (f) Application settings and preferences; (g) AI provider API keys (if configured, stored in browser localStorage). None of this data is transmitted to the Licensor.`,
  },
  {
    title: "4. External Services",
    body: `When you use features that connect to external services, the following data may be transmitted: (a) NCBI Entrez E-utilities: search queries for literature retrieval; (b) OpenAlex / Crossref / ClinicalTrials.gov: bibliographic search queries; (c) Configured AI provider APIs: screening or analysis prompts for AI-assisted features. These transmissions are governed by the respective service providers' privacy policies. We recommend reviewing their policies before use.`,
  },
  {
    title: "5. Analytics and Telemetry",
    body: `Poolr does NOT include analytics, telemetry, crash reporting, or usage tracking. We do not monitor how you use the Software, how often you use it, or what features you access. No usage data is collected or transmitted.`,
  },
  {
    title: "6. Updates",
    body: `If the update feature is enabled, the Software may periodically check for available updates by connecting to GitHub's release infrastructure. No personal information is transmitted during update checks.`,
  },
  {
    title: "7. Data Security",
    body: `Since all data is stored locally, the security of your research data depends on the security of your computer. We recommend: (a) using full-disk encryption; (b) maintaining regular backups; (c) using strong passwords for your user account; (d) keeping your operating system and antivirus software up to date.`,
  },
  {
    title: "8. Data Retention and Deletion",
    body: `Your research data persists on your local machine until you delete it. To remove all data: delete your project files (poolr.json), clear the application's localStorage via your browser or the Settings panel, and uninstall the application.`,
  },
  {
    title: "9. Third-Party Libraries",
    body: `Poolr uses open-source libraries (React, Tauri, Vite, lucide-react, and others). These libraries operate within the application and do not independently transmit data.`,
  },
  {
    title: "10. Children's Privacy",
    body: `The Software is not directed to children under 13. We do not knowingly collect personal information from children.`,
  },
  {
    title: "11. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. Any changes will be posted within the Software and on our repository. Continued use of the Software after changes constitutes acceptance of the updated policy.`,
  },
  {
    title: "12. Contact",
    body: `For privacy-related inquiries, please contact: m.harisawan@icloud.com`,
  },
];

const EULA_SECTIONS = [
  {
    title: "1. Parties and Grant of License",
    body: `This End User License Agreement ("EULA") is a binding agreement between you and Muhammad Haris Awan (d/b/a "The Method Lab") ("Licensor"). Licensor grants you a personal, non-exclusive, non-transferable, revocable license to install and execute Poolr ("the Software") on devices you own or control, solely for academic, clinical, or institutional evidence synthesis. All source code, binaries, and algorithms remain confidential, proprietary trade secrets of the Licensor.`,
  },
  {
    title: "2. Corporate Successor & Entity Transfer",
    body: `Licensor expressly reserves the unilateral right at any time, without notice or consent, to assign, transfer, or novate this EULA, the Software, and all intellectual property rights therein to any corporation, LLC, partnership, or business successor founded, operated, or controlled by Muhammad Haris Awan.`,
  },
  {
    title: "3. Unilateral Paid Plans, Feature Paywalling & No Grandfathering",
    body: `Licensor reserves the absolute right at any time to: (a) Introduce paid subscription tiers, per-seat licenses, and usage quotas; (b) Gate, limit, paywall, or remove any feature (including Drive synchronization, multi-user collaboration, AI extraction, and advanced statistical engines); (c) Convert any previously free capability into a commercial tier without grandfathering or continuing free access for existing users.`,
  },
  {
    title: "4. Permitted Uses",
    body: `You may use the Software for: (a) personal academic research; (b) commercial research and consulting; (c) educational instruction and training; (d) publication of research results generated using the Software. You may create unlimited projects and analyses using the Software.`,
  },
  {
    title: "5. Prohibited Uses",
    body: `You shall NOT: (a) redistribute, sublicense, lease, rent, or loan the Software to third parties; (b) reverse engineer, decompile, disassemble, or otherwise attempt to discover the source code; (c) modify, translate, or create derivative works based on the Software; (d) circumvent or disable any license key, activation mechanism, or copy protection; (e) use the Software to provide commercial hosting, application service provider, or time-sharing services; (f) remove or alter any proprietary notices or labels; (g) use the Software for any illegal purpose.`,
  },
  {
    title: "6. Bring-Your-Own-Storage (BYOS) Integration",
    body: `The Software interfaces directly with your own Google Drive account using your Google OAuth tokens. Datasets and collaboration artifacts are stored in your Google Drive folder. Licensor hosts no user project data and assumes no liability for Google service availability, quota limits, account restrictions, or data loss. Users are responsible for creating regular backups.`,
  },
  {
    title: "7. Citation & Attribution",
    body: `If you publish research results obtained using Poolr, you are requested to cite the Software: Awan, M. H. (2026). Poolr: Desktop platform for systematic reviews & meta-analyses (Version 0.6.4). The Method Lab. https://github.com/harisawan-bit/poolr`,
  },
  {
    title: "8. Medical & Scientific Research Disclaimer",
    body: `THE SOFTWARE IS PROVIDED AS AN EVIDENCE SYNTHESIS AID AND IS NOT A MEDICAL DEVICE. IT DOES NOT PROVIDE MEDICAL, DIAGNOSTIC, OR TREATMENT ADVICE. USERS BEAR SOLE RESPONSIBILITY FOR VERIFYING ALL STATISTICAL ESTIMATES, HETEROGENEITY MEASURES, AND BIAS ASSESSMENTS BEFORE PUBLICATION OR CLINICAL APPLICATION.`,
  },
  {
    title: "9. Disclaimer of Warranties",
    body: `THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.`,
  },
  {
    title: "10. Limitation of Liability",
    body: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, LICENSOR SHALL NOT BE LIABLE FOR ANY INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES. LICENSOR'S AGGREGATE LIABILITY SHALL NOT EXCEED $10.00 USD OR THE TOTAL FEES PAID BY YOU IN THE PRECEDING 12 MONTHS.`,
  },
  {
    title: "11. Governing Law & Dispute Resolution",
    body: `This EULA is governed by the laws of the Islamic Republic of Pakistan. Any disputes shall be subject to the exclusive jurisdiction of the competent courts in Islamabad/Rawalpindi, Pakistan.`,
  },
  {
    title: "12. Contact",
    body: `Licensing & inquiries: Muhammad Haris Awan (d/b/a The Method Lab) · Email: m.harisawan@icloud.com · Repository: https://github.com/harisawan-bit/poolr`,
  },
];

export default function LegalCenter() {
  const [page, setPage] = useState<LegalPage>("menu");

  const sections = page === "tos" ? TOS_SECTIONS : page === "privacy" ? PRIVACY_SECTIONS : page === "eula" ? EULA_SECTIONS : [];

  return (
    <div className="space-y-3">
      {page !== "menu" && (
        <Button variant="ghost" size="sm" onClick={() => setPage("menu")}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Legal Center
        </Button>
      )}

      {page === "menu" && (
        <>
          <Card title="Legal Center">
            <p className="mb-4 text-[12.5px] text-[var(--color-text-muted)]">
              Poolr v0.6.4 — Commercial Platform · The Method Lab. Please review our legal documents.
            </p>
          </Card>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              className="card p-5 text-left transition-colors hover:bg-[var(--hover-surface)]"
              onClick={() => setPage("tos")}
            >
              <Scale className="mb-2 h-6 w-6 text-[var(--color-accent)]" />
              <h3 className="mb-1 text-[14px] font-semibold">Terms of Service</h3>
              <p className="text-[12px] text-[var(--color-text-muted)]">
                Rules and conditions for using Poolr. Covers BYOS architecture, unilateral paid tiers, corporate assignment, and research liability.
              </p>
            </button>

            <button
              className="card p-5 text-left transition-colors hover:bg-[var(--hover-surface)]"
              onClick={() => setPage("privacy")}
            >
              <Shield className="mb-2 h-6 w-6 text-[var(--color-accent)]" />
              <h3 className="mb-1 text-[14px] font-semibold">Privacy Policy</h3>
              <p className="text-[12px] text-[var(--color-text-muted)]">
                How Poolr handles your data. Local-first computation: no telemetry or remote tracking. Google Drive sync operates via direct user OAuth conduit.
              </p>
            </button>

            <button
              className="card p-5 text-left transition-colors hover:bg-[var(--hover-surface)]"
              onClick={() => setPage("eula")}
            >
              <FileText className="mb-2 h-6 w-6 text-[var(--color-accent)]" />
              <h3 className="mb-1 text-[14px] font-semibold">End User License Agreement</h3>
              <p className="text-[12px] text-[var(--color-text-muted)]">
                The full legal agreement between you and Muhammad Haris Awan (d/b/a The Method Lab). Permitted uses, restrictions, warranties, and corporate successor terms.
              </p>
            </button>
          </div>

          <Card title="License Notice">
            <p className="text-[12px] leading-relaxed text-[var(--color-text-muted)]">
              Poolr is closed-source proprietary software. © 2026 Muhammad Haris Awan (d/b/a The Method Lab). All rights reserved.
              Unauthorized copying, decompilation, redistribution, or modification of this software is strictly prohibited.
              Provided under a proprietary license — see the EULA for complete terms.
            </p>
          </Card>
        </>
      )}

      {page !== "menu" && (
        <Card title={page === "tos" ? "Terms of Service" : page === "privacy" ? "Privacy Policy" : "End User License Agreement"}>
          <p className="mb-4 text-[11px] text-[var(--color-text-muted)]">
            Effective Date: September 18, 2026 · Last Updated: September 18, 2026 · Version 0.6.4
          </p>
          <div className="max-h-[calc(100vh-280px)] space-y-5 overflow-y-auto pr-2">
            {sections.map((section, i) => (
              <div key={i}>
                <h3 className="mb-2 text-[13px] font-semibold text-[var(--color-text)]">{section.title}</h3>
                <p className="text-[12px] leading-relaxed text-[var(--color-text-muted)]">{section.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
            <p className="text-[10.5px] text-[var(--color-text-muted)]">
              © 2026 Muhammad Haris Awan (d/b/a The Method Lab). All rights reserved.
            </p>
            <Button variant="ghost" size="sm" onClick={() => setPage("menu")}>
              Back to Legal Center
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
