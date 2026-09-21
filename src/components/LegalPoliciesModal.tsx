import React, { useState } from 'react';
import {
  Shield,
  FileText,
  AlertTriangle,
  Lock,
  X,
  CheckCircle2,
  ExternalLink,
  Mail,
  UserCheck,
  Scale,
  Ban,
  Clock,
  ChevronRight,
  Trash2,
  ShieldCheck,
  Database,
} from 'lucide-react';

interface LegalPoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'privacy' | 'terms' | 'ugc' | 'data-safety';
  onOpenDeleteAccount?: () => void;
}

export const LegalPoliciesModal: React.FC<LegalPoliciesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
  onOpenDeleteAccount,
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'ugc' | 'data-safety'>(initialTab);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div
      id="legal-policies-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="legal-policies-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Legal & Compliance</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Play Store UGC Guidelines, Privacy Policy & Terms of Service
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close legal modal"
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-100 dark:border-neutral-800 px-4 pt-2 text-xs font-semibold overflow-x-auto no-scrollbar gap-2">
          <button
            id="tab-privacy-policy"
            onClick={() => setActiveTab('privacy')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>

          <button
            id="tab-terms-service"
            onClick={() => setActiveTab('terms')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </button>

          <button
            id="tab-ugc-guidelines"
            onClick={() => setActiveTab('ugc')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'ugc'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>UGC Safety & Community Guidelines</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-500/20">
              Mandatory
            </span>
          </button>

          <button
            id="tab-data-safety"
            onClick={() => setActiveTab('data-safety')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'data-safety'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Data Safety & Deletion</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
              Play Store
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300">
                <p className="font-semibold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  Effective Date: September 15, 2026 • Version 2.4 (Play Store Compliant)
                </p>
                <p className="text-[11px] mt-1 text-amber-700 dark:text-amber-400/90">
                  Jhalak values your personal privacy. We strictly follow Google Play Store User Data policies and the Indian Information Technology Act, 2000 (SPDI Rules 2011).
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                  1. Information We Collect
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-neutral-600 dark:text-neutral-400">
                  <li>
                    <strong>Account Information:</strong> Name, email address, username, profile photo, and bio provided via Google Sign-In or manual setup.
                  </li>
                  <li>
                    <strong>User-Generated Content:</strong> Photos, short videos (Reels), captions, tags, comments, likes, and audio selections you post.
                  </li>
                  <li>
                    <strong>Direct Messages:</strong> Private messages and shared media sent between users within the platform.
                  </li>
                  <li>
                    <strong>Technical & Local Device Data:</strong> Local storage preferences (such as dark mode, selected language, reported post IDs, and blocked creator IDs).
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                  2. How We Use Your Information
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-neutral-600 dark:text-neutral-400">
                  <li>To provide, personalize, and curate your personalized Indian cultural feed and Explore tabs.</li>
                  <li>To facilitate creator tipping, UPI Shagun transactions, and product inquiries on WhatsApp.</li>
                  <li>To enforce community safety, detect harassment, spam, and explicit content.</li>
                  <li>To comply with regulatory obligations and law enforcement requests under applicable laws.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                  3. Permanent Account & Data Deletion (Google Play Mandate)
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-2">
                  In strict compliance with Google Play Developer Policies and data privacy regulations, all users have the unconditional right to delete their account and associated data. You can trigger immediate account deletion directly from the Profile Settings menu, or right here:
                </p>
                {onOpenDeleteAccount && (
                  <div className="p-3 my-2 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3">
                    <div className="text-[11px] text-rose-700 dark:text-rose-300">
                      <strong>Delete Account:</strong> Permanently purges your profile, reels, photos, comments, and data.
                    </div>
                    <button
                      type="button"
                      id="privacy-policy-delete-account-btn"
                      onClick={() => {
                        onClose();
                        onOpenDeleteAccount();
                      }}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Account</span>
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                  External web deletion portal URL: <code className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-amber-600 dark:text-amber-400 font-mono text-[10px]">{typeof window !== 'undefined' ? window.location.origin : 'https://jhalak.app'}/?page=delete-account</code>
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                  4. Data Security & Storage
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  We employ industry-standard encryption protocols (TLS/HTTPS in transit and secure AES storage) to protect personal identifiers. We do not sell your personal data to third-party data brokers.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                  5. Children's Privacy (Google Play Families Policy)
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Jhalak Reels is not directed to children under the age of 13. We do not knowingly collect personal data from children under 13. If you believe a child under 13 has provided us with personal information, please contact <a href="mailto:privacy@jhalak.app" className="underline text-amber-500">privacy@jhalak.app</a> and we will immediately purge the record.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                  6. Third-Party SDKs & Advertising Disclosures
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  We use trusted Google cloud infrastructure (Firebase Authentication, Cloud Firestore, Cloud Storage) to authenticate users and serve user media securely. We may display non-personalized, non-intrusive creator sponsored banners or cultural announcements that comply with Google Play Developer Policy.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
                <span>Questions about our Privacy Policy?</span>
                <a
                  href="mailto:privacy@jhalak.app"
                  className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" /> privacy@jhalak.app
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40 text-sky-800 dark:text-sky-300">
                <p className="font-semibold text-xs flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                  Jhalak User Terms of Service & Intermediary Agreement
                </p>
                <p className="text-[11px] mt-1 text-sky-700 dark:text-sky-400/90">
                  By creating an account or accessing the Jhalak app, you agree to be bound by these Terms of Service.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1.5">
                  1. Eligibility & Age Restriction
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  You must be at least 13 years of age (or the legal age of consent in your jurisdiction) to use Jhalak. If you are using Jhalak on behalf of a business, you represent that you have legal authority to bind that entity.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1.5">
                  2. Content Ownership & License
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  You retain all intellectual property rights in the content you create and upload to Jhalak. By uploading content, you grant Jhalak a non-exclusive, royalty-free, worldwide license to host, display, and distribute your content across the platform.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1.5">
                  3. Creator Monetization, UPI Shagun & Product Tags
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Jhalak provides tools for UPI tipping (Shagun) and product tag catalogs connecting to WhatsApp. Sellers and creators are solely responsible for the authenticity and delivery of goods sold. Jhalak charges 0% platform commission on direct peer-to-peer UPI payments.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1.5">
                  4. Account Suspension & Termination
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  We reserve the right to suspend or permanently ban any account that violates our User-Generated Content Guidelines, engages in fraudulent behavior, or fails to respect other community members.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: UGC COMMUNITY GUIDELINES (Google Play Compliance Focus) */}
          {activeTab === 'ugc' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                  <h4 className="font-bold text-xs">
                    Zero Tolerance Policy for Objectionable Content & Abusive Users
                  </h4>
                </div>
                <p className="text-[11px] mt-1.5 text-rose-700 dark:text-rose-400/90 leading-relaxed">
                  As required by Google Play Developer Policies and Indian Intermediary Rules, Jhalak maintains a strict zero-tolerance stance against harmful content. Users who violate these rules are subject to immediate content removal and permanent account bans.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <Ban className="w-4 h-4 text-rose-500" />
                  Prohibited Content on Jhalak:
                </h3>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
                    <p className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <span>🚫</span> Harassment & Bullying
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Targeted intimidation, stalking, blackmail, threats of physical harm, or sharing non-public personal information (doxxing).
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
                    <p className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <span>⚠️</span> Hate Speech & Discriminatory Content
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Attacking, dehumanizing, or inciting hatred against individuals or groups based on race, religion, caste, sexual orientation, disability, or gender.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
                    <p className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <span>🔞</span> Explicit, Pornographic or NSFW Content
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Depictions of sexual acts, genitalia, nudity, or non-consensual sexual content. Zero tolerance for Child Sexual Abuse Material (CSAM), which is immediately reported to authorities.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
                    <p className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <span>⚔️</span> Violence, Illegal Goods & Terrorism
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Promoting violent extremism, dangerous illegal goods, weapons, narcotic substances, or self-harm encouragement.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
                    <p className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <span>🚨</span> Deception, Spam & Impersonation
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Financial scams, phishing, coordinated artificial engagement, or falsely impersonating another creator or organization.
                    </p>
                  </div>
                </div>
              </div>

              {/* In-App Enforcement & Response SLA */}
              <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-xs">
                    Rapid Review SLA & Safety Mechanisms:
                  </span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                  <li>
                    <strong>Immediate Feed Hiding:</strong> When you tap <em>"Report Post"</em> or <em>"Block User"</em>, that content is instantly removed from your feed.
                  </li>
                  <li>
                    <strong>24-Hour Review SLA:</strong> All submitted reports are reviewed by our Trust & Safety moderation team within 24 hours.
                  </li>
                  <li>
                    <strong>User Blocking:</strong> Users can block any account at any time, preventing that user from seeing profile content or interacting.
                  </li>
                </ul>
              </div>

              {/* Grievance Redressal Mechanism */}
              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 space-y-1.5">
                <p className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-amber-500" />
                  Grievance Officer (India IT Rules, 2021)
                </p>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 space-y-0.5">
                  <p><strong>Name:</strong> Brijmohan Sharma</p>
                  <p><strong>Designation:</strong> Chief Grievance & Compliance Officer</p>
                  <p><strong>Email:</strong> grievance@jhalak.app / legal@jhalak.app</p>
                  <p><strong>Address:</strong> Jhalak Digital Media Labs Pvt. Ltd., Bengaluru, Karnataka 560001</p>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Grievance complaints will be acknowledged within 24 hours and addressed within 15 days in compliance with statutory requirements.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DATA SAFETY & ACCOUNT DELETION (Google Play Console Compliance) */}
          {activeTab === 'data-safety' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <h4 className="font-bold text-xs">
                    Google Play Store Data Safety Section Declaration
                  </h4>
                </div>
                <p className="text-[11px] mt-1.5 text-emerald-800 dark:text-emerald-400/90 leading-relaxed">
                  Below is the exact data safety disclosure for Jhalak Reels: Made in India as filed in the Google Play Developer Console, verifying data collection, encryption, and our complete account deletion mechanism.
                </p>
              </div>

              {/* Data Collected Table */}
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-500" />
                  Data Collected by Jhalak
                </h3>
                <div className="space-y-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700/60">
                    <strong className="block text-neutral-900 dark:text-white">Personal Information</strong>
                    <span className="text-neutral-500">Name, Google email address, username, profile photo, and bio. Collected for app functionality and account creation.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700/60">
                    <strong className="block text-neutral-900 dark:text-white">Photos & Videos (User Generated Content)</strong>
                    <span className="text-neutral-500">Reels, videos, photos, audio tracks, and captions uploaded by users for sharing.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700/60">
                    <strong className="block text-neutral-900 dark:text-white">Messages & In-App Interactions</strong>
                    <span className="text-neutral-500">Likes, comments, shares, followed creators, watch duration, and direct messages.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700/60">
                    <strong className="block text-neutral-900 dark:text-white">App Info & Performance</strong>
                    <span className="text-neutral-500">Crash logs, diagnostic events, and performance diagnostics to improve reliability.</span>
                  </div>
                </div>
              </div>

              {/* Security Practices */}
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-500" />
                  Security Practices
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-neutral-600 dark:text-neutral-400 text-xs">
                  <li><strong>Data encrypted in transit:</strong> All data transfers are encrypted using TLS 1.3/HTTPS.</li>
                  <li><strong>No Data Sold:</strong> Your data is never sold to third-party data brokers or advertisers.</li>
                  <li><strong>User Deletion Guarantee:</strong> You can request that your data be deleted at any time.</li>
                </ul>
              </div>

              {/* Account Deletion & Data Erasure */}
              <div className="p-4 rounded-xl bg-rose-500/10 border-2 border-rose-500/30 text-rose-800 dark:text-rose-200 space-y-2">
                <h4 className="font-bold text-xs text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  Account & Data Deletion Portal (Google Play Policy)
                </h4>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  You can permanently delete your account and all associated data either directly in the app or via our external web resource URL. Once requested, your profile, posts, reels, comments, and messages are permanently purged from all databases.
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  {onOpenDeleteAccount && (
                    <button
                      type="button"
                      id="data-safety-delete-account-btn"
                      onClick={() => {
                        onClose();
                        onOpenDeleteAccount();
                      }}
                      className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete My Account & Data Now</span>
                    </button>
                  )}
                  <a
                    href="/?page=delete-account"
                    className="py-2 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold text-xs transition"
                  >
                    Direct Web Deletion Link: /?page=delete-account
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Acknowledgement */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/80">
          <div className="flex items-center gap-2 text-[11px] text-neutral-500">
            <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Play Store UGC Safe App Verified</span>
          </div>
          <button
            type="button"
            id="legal-modal-agree-btn"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold shadow-sm hover:opacity-90 transition"
          >
            I Understand & Accept
          </button>
        </div>
      </div>
    </div>
  );
};
