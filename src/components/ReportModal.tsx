import React, { useState } from 'react';
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  Flag,
  ShieldAlert,
  X,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { REPORT_REASONS, ReportReason, moderationService } from '../services/moderationService';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: {
    id: string;
    type: 'post' | 'reel';
    username: string;
    caption?: string;
  } | null;
  initialMode?: 'report' | 'block';
  onReportSubmitted: (id: string, reason: string) => void;
  onUserBlocked: (username: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  target,
  initialMode = 'report',
  onReportSubmitted,
  onUserBlocked,
}) => {
  const [mode, setMode] = useState<'report' | 'block'>(initialMode);
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [blockReason, setBlockReason] = useState<string>('Inappropriate behavior');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen || !target) return null;

  const handleReportSubmit = () => {
    if (!selectedReason) return;
    moderationService.reportItem({
      id: target.id,
      type: target.type,
      username: target.username,
      reason: selectedReason,
    });
    setIsSubmitted(true);
    setTimeout(() => {
      onReportSubmitted(target.id, selectedReason);
      setIsSubmitted(false);
      setSelectedReason(null);
      onClose();
    }, 1200);
  };

  const handleBlockSubmit = () => {
    moderationService.blockUser(target.username, blockReason);
    setIsSubmitted(true);
    setTimeout(() => {
      onUserBlocked(target.username);
      setIsSubmitted(false);
      onClose();
    }, 1000);
  };

  return (
    <div
      id="report-moderation-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="report-moderation-dialog"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            {mode === 'report' ? (
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Flag className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                <Ban className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-base leading-tight">
                {mode === 'report' ? 'Report Content' : `Block @${target.username}`}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {mode === 'report' ? 'Help us keep Jhalak safe & clean' : 'Manage privacy & safety'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher if desired */}
        <div className="flex border-b border-neutral-100 dark:border-neutral-800 text-xs font-semibold px-4 pt-2">
          <button
            onClick={() => setMode('report')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              mode === 'report'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Report Post / Reel</span>
          </button>
          <button
            onClick={() => setMode('block')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              mode === 'block'
                ? 'border-rose-500 text-rose-500'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Block @{target.username}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {isSubmitted ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-lg">
                {mode === 'report' ? 'Report Received' : 'User Blocked'}
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs">
                {mode === 'report'
                  ? 'Thank you for reporting. This post has been submitted for review and hidden from your feed.'
                  : `You will no longer see posts, reels, or stories from @${target.username}.`}
              </p>
            </div>
          ) : mode === 'report' ? (
            <div>
              {/* Target info */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 mb-4 flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div className="text-xs min-w-0 flex-1">
                  <p className="font-medium text-neutral-700 dark:text-neutral-300 truncate">
                    Reporting {target.type === 'reel' ? 'Reel' : 'Post'} by{' '}
                    <span className="font-bold text-neutral-900 dark:text-white">
                      @{target.username}
                    </span>
                  </p>
                  {target.caption && (
                    <p className="text-neutral-400 truncate mt-0.5 italic">"{target.caption}"</p>
                  )}
                </div>
              </div>

              {/* Quick Reason Tags */}
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2.5">
                Why are you reporting this?
              </label>

              <div className="space-y-2">
                {REPORT_REASONS.map((r) => {
                  const isSelected = selectedReason === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedReason(r.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 shadow-sm'
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-neutral-700 dark:text-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{r.icon}</span>
                        <div>
                          <p className="text-xs font-semibold">{r.label}</p>
                          <p className="text-[11px] text-neutral-400">{r.hindiLabel}</p>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected ? 'rotate-90 text-amber-500' : 'text-neutral-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="submit-report-button"
                  disabled={!selectedReason}
                  onClick={handleReportSubmit}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md hover:opacity-95 transition"
                >
                  Submit Report
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Block confirmation dialog */}
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-center space-y-2 mb-4">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Block @{target.username}?
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  They won't be able to message you, find your profile, or see your posts on Jhalak.
                  Their content will immediately be removed from your feed.
                </p>
              </div>

              {/* Block Reason Tags */}
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                Reason (Optional)
              </label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {['Inappropriate behavior', 'Spam / Scam', 'Harassment', 'Other reason'].map(
                  (opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setBlockReason(opt)}
                      className={`p-2 rounded-xl text-xs font-medium border text-center transition ${
                        blockReason === opt
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-500'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {opt}
                    </button>
                  )
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-neutral-400 mb-4">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Jhalak does not notify users when they are blocked.</span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="confirm-block-user-button"
                  onClick={handleBlockSubmit}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition"
                >
                  Block @{target.username}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
