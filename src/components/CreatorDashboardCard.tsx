import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Lock,
  CheckCircle2,
  TrendingUp,
  Clock,
  Users,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  Film,
  Image as ImageIcon,
  IndianRupee,
} from 'lucide-react';
import {
  MONETIZATION_POLICY,
  getCreatorMonetizationStats,
  setCreatorStats,
  getDailyUploads,
  CreatorMonetizationStats,
} from '../services/monetizationService';
import { User } from '../types';

interface CreatorDashboardCardProps {
  currentUser?: User;
  user?: User;
  onOpenMonetizationView: () => void;
}

export const CreatorDashboardCard: React.FC<CreatorDashboardCardProps> = ({
  currentUser: initialCurrentUser,
  user: initialUser,
  onOpenMonetizationView,
}) => {
  const currentUser: User = initialCurrentUser || initialUser || {
    id: 'user-me',
    username: 'creator',
    name: 'Creator',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    bio: '',
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    watchHours: 0,
    dailyPhotosCount: 0,
    dailyReelsCount: 0,
  };

  const followers = currentUser.followersCount || 0;
  const watchHours = currentUser.watchHours || 0;
  const targetFollowers = MONETIZATION_POLICY.TARGET_FOLLOWERS;
  const targetWatchHours = MONETIZATION_POLICY.TARGET_WATCH_HOURS;
  const followersPct = Math.min(100, Math.round((followers / targetFollowers) * 100));
  const watchHoursPct = Math.min(100, Math.round((watchHours / targetWatchHours) * 100));
  const followersRemaining = Math.max(0, targetFollowers - followers);
  const watchHoursRemaining = Math.max(0, targetWatchHours - watchHours);
  const isUnlocked = followers >= targetFollowers && watchHours >= targetWatchHours;

  const stats: CreatorMonetizationStats = {
    followers,
    targetFollowers,
    followersPct,
    followersRemaining,
    watchHours,
    targetWatchHours,
    watchHoursPct,
    watchHoursRemaining,
    isUnlocked,
  };

  const dailyUploads = getDailyUploads(currentUser.id);
  const photosUsed = currentUser.dailyPhotosCount ?? dailyUploads.photos.length;
  const reelsUsed = currentUser.dailyReelsCount ?? dailyUploads.reels.length;

  return (
    <div
      id="creator-dashboard-card"
      className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-md space-y-4 mb-4"
    >
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white flex items-center gap-2">
              Creator Dashboard (क्रिएटर डैशबोर्ड)
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Policy: Target 2,000 Followers & 2,000 Watch Hours
            </p>
          </div>
        </div>

        {/* Status Pill */}
        {stats.isUnlocked ? (
          <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Monetization 100% Achieved
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            Monetization Locked (In Progress)
          </span>
        )}
      </div>

      {/* Visual Dual Progress Bars */}
      <div className="space-y-3.5 bg-neutral-100/70 dark:bg-neutral-800/40 p-3.5 sm:p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800">
        {/* Metric 1: Followers */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-500" />
              Followers Target (फॉलोअर्स):
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-neutral-900 dark:text-white font-bold">
                {stats.followers.toLocaleString()} / {stats.targetFollowers.toLocaleString()}
              </span>
              <span className="text-[11px] px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold">
                {stats.followersPct}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ease-out ${
                stats.followers >= stats.targetFollowers
                  ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]'
                  : 'bg-gradient-to-r from-sky-500 to-amber-500'
              }`}
              style={{ width: `${stats.followersPct}%` }}
            />
          </div>

          {/* Remaining Followers Display */}
          <div className="flex items-center justify-between text-[11px]">
            {stats.followersRemaining === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Target 2,000 followers achieved!
              </span>
            ) : (
              <span className="text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                <span>🎯</span>
                <strong>{stats.followersRemaining.toLocaleString()}</strong> followers remaining to unlock monetization
              </span>
            )}
            <span className="text-neutral-400 font-mono text-[10px]">Goal: 2,000</span>
          </div>
        </div>

        {/* Metric 2: Watch Hours */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Watch Hours Target (व्यू वॉच आवर्स):
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-neutral-900 dark:text-white font-bold">
                {stats.watchHours.toLocaleString()} / {stats.targetWatchHours.toLocaleString()} hrs
              </span>
              <span className="text-[11px] px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold">
                {stats.watchHoursPct}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ease-out ${
                stats.watchHours >= stats.targetWatchHours
                  ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]'
                  : 'bg-gradient-to-r from-amber-500 to-rose-500'
              }`}
              style={{ width: `${stats.watchHoursPct}%` }}
            />
          </div>

          {/* Remaining Watch Hours Display */}
          <div className="flex items-center justify-between text-[11px]">
            {stats.watchHoursRemaining === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Target 2,000 watch hours achieved!
              </span>
            ) : (
              <span className="text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                <span>⏱️</span>
                <strong>{stats.watchHoursRemaining.toLocaleString()}</strong> watch hours remaining to unlock monetization
              </span>
            )}
            <span className="text-neutral-400 font-mono text-[10px]">Goal: 2,000 hrs</span>
          </div>
        </div>
      </div>

      {/* Payout Eligibility Status Notice */}
      <div
        className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
          stats.isUnlocked
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
            : 'bg-neutral-100 dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700/80 text-neutral-700 dark:text-neutral-300'
        }`}
      >
        {stats.isUnlocked ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-700 dark:text-emerald-400">
                UPI Payouts Application Unlocked (पात्रता स्वीकृत)
              </p>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
                Both 2,000 followers and 2,000 watch hours criteria are 100% satisfied. You can apply for direct UPI settlement.
              </p>
            </div>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-neutral-900 dark:text-white flex items-center gap-1">
                <span>UPI Payouts Locked</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">(Requires 100% on both metrics)</span>
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Need <strong>{stats.followersRemaining.toLocaleString()}</strong> more followers and <strong>{stats.watchHoursRemaining.toLocaleString()}</strong> more watch hours before you can submit a UPI payout application.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Daily Limits Quota pill */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 text-xs">
        <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Daily Uploads (दैनिक अपलोड):
        </span>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Unlimited (असीमित)</span>
        </div>
      </div>

      {/* Payout & Monetization CTA Button */}
      <button
        id="open-monetization-view-btn"
        type="button"
        onClick={onOpenMonetizationView}
        className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-sm ${
          stats.isUnlocked
            ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold'
            : 'bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 text-white border border-neutral-700'
        }`}
      >
        <IndianRupee className="w-4 h-4" />
        <span>
          {stats.isUnlocked
            ? 'Open UPI Payouts & Monetization (पेआउट निकालें)'
            : 'View Monetization Details & Status (मोनेटाइजेशन देखें)'}
        </span>
        <ArrowUpRight className="w-4 h-4" />
      </button>
    </div>
  );
};
