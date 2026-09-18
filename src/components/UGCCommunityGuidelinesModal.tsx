import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Lock,
  X,
  ExternalLink,
  Heart,
  Scale,
  Sparkles,
} from 'lucide-react';
import { safeGetItem, safeSetItem } from '../utils/safeStorage';

export const UGC_CONSENT_KEY = 'jhalak_ugc_terms_consented_v1';

export function hasUserConsentedToUGC(): boolean {
  try {
    return Boolean(safeGetItem(UGC_CONSENT_KEY));
  } catch {
    return false;
  }
}

export function setUserConsentedToUGC(): void {
  try {
    safeSetItem(UGC_CONSENT_KEY, new Date().toISOString());
  } catch {
    // Ignore storage issues
  }
}

interface UGCCommunityGuidelinesModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onOpenFullPolicy?: (tab: 'privacy' | 'terms' | 'ugc') => void;
}

export const UGCCommunityGuidelinesModal: React.FC<UGCCommunityGuidelinesModalProps> = ({
  isOpen,
  onAccept,
  onDecline,
  onOpenFullPolicy,
}) => {
  const [hasCheckedConsent, setHasCheckedConsent] = useState(true);

  if (!isOpen) return null;

  const handleAgree = () => {
    setUserConsentedToUGC();
    onAccept();
  };

  return (
    <div
      id="ugc-guidelines-consent-modal"
      className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom duration-300"
      >
        {/* Header with Safety Gradient */}
        <div className="relative p-5 pb-4 bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-amber-500/10 border-b border-neutral-200/80 dark:border-neutral-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-md flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white leading-tight">
                    Creator Community Guidelines
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/30">
                    Policy
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Play Store & Jhalak Safety Standards for Creators
                </p>
              </div>
            </div>

            <button
              id="close-ugc-consent-btn"
              type="button"
              onClick={onDecline}
              className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition cursor-pointer"
              title="Close guidelines"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Core Rules List */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1 text-xs">
          <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium">
            Jhalak is dedicated to celebrating vibrant Bhojpuri culture, music, comedy, and artistic creativity. To ensure a safe environment for everyone, all creators must adhere to our zero-tolerance policies before recording or publishing content:
          </p>

          <div className="space-y-2.5">
            {/* Rule 1: Zero Tolerance */}
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200/80 dark:border-neutral-700/60 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-500 flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-neutral-900 dark:text-white">
                  Zero Tolerance for Objectionable Content
                </h4>
                <p className="text-neutral-500 dark:text-neutral-400 mt-0.5 leading-normal">
                  Strictly no nudity, sexually explicit material, violence, hate speech, dangerous acts, harassment, or illegal substances. Violations result in immediate content takedown.
                </p>
              </div>
            </div>

            {/* Rule 2: Copyright & Originality */}
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200/80 dark:border-neutral-700/60 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-500 flex-shrink-0 mt-0.5">
                <Scale className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-neutral-900 dark:text-white">
                  Respect Intellectual Property & Music Rights
                </h4>
                <p className="text-neutral-500 dark:text-neutral-400 mt-0.5 leading-normal">
                  Only share original reels or music and sounds that you have the right or license to use (such as our provided Bhojpuri Soundtrack library).
                </p>
              </div>
            </div>

            {/* Rule 3: Respect & Kindness */}
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200/80 dark:border-neutral-700/60 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-500 flex-shrink-0 mt-0.5">
                <Heart className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-neutral-900 dark:text-white">
                  Respectful Community Interactions
                </h4>
                <p className="text-neutral-500 dark:text-neutral-400 mt-0.5 leading-normal">
                  Bullying, hate raids, abusive DMs, or impersonation of creators or public figures is strictly prohibited.
                </p>
              </div>
            </div>

            {/* Rule 4: Rapid Moderation & Account Bans */}
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200/80 dark:border-neutral-700/60 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-500 flex-shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-neutral-900 dark:text-white">
                  24-Hour Moderation & Account Suspension
                </h4>
                <p className="text-neutral-500 dark:text-neutral-400 mt-0.5 leading-normal">
                  Reported items are reviewed within 24 hours. Repeat offenders will face permanent device and account suspension.
                </p>
              </div>
            </div>
          </div>

          {/* Links to Full Legal Documents */}
          <div className="pt-1 flex flex-wrap items-center justify-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400">
            {onOpenFullPolicy ? (
              <>
                <button
                  type="button"
                  onClick={() => onOpenFullPolicy('ugc')}
                  className="hover:text-rose-500 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>UGC Policy Details</span>
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => onOpenFullPolicy('terms')}
                  className="hover:text-rose-500 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Terms of Service</span>
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => onOpenFullPolicy('privacy')}
                  className="hover:text-rose-500 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Privacy Policy</span>
                </button>
              </>
            ) : null}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200/80 dark:border-neutral-800 flex flex-col gap-3">
          {/* Checkbox agreement */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              id="ugc-consent-checkbox"
              checked={hasCheckedConsent}
              onChange={(e) => setHasCheckedConsent(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 text-rose-500 focus:ring-rose-500 cursor-pointer"
            />
            <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium leading-tight">
              I agree to abide by the Jhalak Community Guidelines and Terms of Service.
            </span>
          </label>

          <div className="flex items-center gap-2.5">
            <button
              id="ugc-consent-decline-btn"
              type="button"
              onClick={onDecline}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-200/80 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="ugc-consent-agree-btn"
              type="button"
              disabled={!hasCheckedConsent}
              onClick={handleAgree}
              className="flex-[2] py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Agree & Continue</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
