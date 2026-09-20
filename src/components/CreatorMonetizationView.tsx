import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  BadgeCheck,
  Gift,
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Check,
  Users,
} from 'lucide-react';
import { User } from '../types';
import { AdMobRewardedAdModal } from './AdMobRewardedAdModal';
import { MONETIZATION_POLICY } from '../services/monetizationService';

interface TipTransaction {
  id: string;
  from: string;
  avatar: string;
  amount: number;
  app: string;
  note: string;
  date: string;
  type: 'credit' | 'payout';
}

interface CreatorMonetizationViewProps {
  currentUser?: User;
  user?: User;
  onClose?: () => void;
}

export const CreatorMonetizationView: React.FC<CreatorMonetizationViewProps> = ({
  currentUser: initialCurrentUser,
  user: initialUser,
  onClose,
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
  };
  // Balance & Payout states
  const [balance, setBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`ig_creator_balance_${currentUser.id}`);
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });
  const [upiId, setUpiId] = useState(`${currentUser.username.toLowerCase()}@oksbi`);
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [tempUpi, setTempUpi] = useState(upiId);
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [payoutSuccessMessage, setPayoutSuccessMessage] = useState<string | null>(null);
  const [showRewardedAd, setShowRewardedAd] = useState(false);

  // Real transactions list (persisted in local storage per user)
  const [transactions, setTransactions] = useState<TipTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(`ig_creator_txs_${currentUser.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Save balance and transactions
  useEffect(() => {
    try {
      localStorage.setItem(`ig_creator_balance_${currentUser.id}`, String(balance));
      localStorage.setItem(`ig_creator_txs_${currentUser.id}`, JSON.stringify(transactions));
    } catch {}
  }, [balance, transactions, currentUser.id]);

  // Policy Targets
  const TARGET_FOLLOWERS = MONETIZATION_POLICY.TARGET_FOLLOWERS; // 2,000
  const TARGET_WATCH_HOURS = MONETIZATION_POLICY.TARGET_WATCH_HOURS; // 2,000

  // Real followers and watch hours loaded exclusively from user profile
  const effectiveFollowers = currentUser.followersCount || 0;
  const effectiveWatchHours = currentUser.watchHours || 0;

  const followersPct = Math.min(100, Math.round((effectiveFollowers / TARGET_FOLLOWERS) * 100));
  const watchHoursPct = Math.min(100, Math.round((effectiveWatchHours / TARGET_WATCH_HOURS) * 100));

  const followersRemaining = Math.max(0, TARGET_FOLLOWERS - effectiveFollowers);
  const watchHoursRemaining = Math.max(0, TARGET_WATCH_HOURS - effectiveWatchHours);

  // STRICT REQUIREMENT 4: UPI Payout Application locked until BOTH 2,000 followers and 2,000 hours are 100% achieved
  const isPayoutUnlocked = effectiveFollowers >= TARGET_FOLLOWERS && effectiveWatchHours >= TARGET_WATCH_HOURS;

  // Simulated Instant UPI Payout
  const handleExecutePayout = () => {
    if (!isPayoutUnlocked || balance <= 0) return;
    setIsProcessingPayout(true);
    setPayoutSuccessMessage(null);

    setTimeout(() => {
      const amountWithdrawn = balance;
      setBalance(0);
      setIsProcessingPayout(false);
      const referenceId = `UPI/2026/${Math.floor(100000 + Math.random() * 900000)}`;
      setPayoutSuccessMessage(
        `₹${amountWithdrawn.toLocaleString('en-IN')} successfully transferred to ${upiId}! (Ref: ${referenceId})`
      );

      // Add payout transaction
      setTransactions((prev) => [
        {
          id: `payout-${Date.now()}`,
          from: 'Jhalak Creator Payout',
          avatar: currentUser.avatar,
          amount: amountWithdrawn,
          app: 'Instant IMPS/UPI',
          note: `Settlement to ${upiId}`,
          date: 'Just now',
          type: 'payout',
        },
        ...prev,
      ]);
    }, 1400);
  };

  const handleTopUpSimulation = () => {
    setBalance((prev) => prev + 2500);
    setPayoutSuccessMessage(null);
  };

  const handleRewardedAdCompleted = (rewardText: string, amount: number) => {
    setBalance((prev) => prev + amount);
    const newTx: TipTransaction = {
      id: `tx-rewarded-${Date.now()}`,
      from: 'Google AdMob Rewards',
      avatar: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=100',
      amount: amount,
      app: 'Google AdMob',
      note: `${rewardText} (Ad Unit: 6333724469)`,
      date: 'Just now',
      type: 'credit',
    };
    setTransactions((prev) => [newTx, ...prev]);
    setPayoutSuccessMessage(`🎉 ${rewardText} credited to your UPI balance!`);
    setTimeout(() => setPayoutSuccessMessage(null), 5000);
  };

  return (
    <div id="creator-monetization-view" className="space-y-4 pb-2">
      {/* 1. EARNINGS SUMMARY CARD */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-emerald-950 p-4 sm:p-5 text-white shadow-xl border border-emerald-500/30">
        {/* Shimmer background glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-neutral-300 block uppercase tracking-wider">
                  Available Balance (कुल शेष राशि)
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Instant UPI Settlement Enabled
                </span>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
              0% Platform Fee 🇮🇳
            </span>
          </div>

          {/* Amount Display */}
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-baseline gap-1">
                <span>₹</span>
                <span>{balance.toLocaleString('en-IN')}</span>
              </div>
              <span className="text-[11px] text-neutral-400 block mt-0.5">
                Pending clearance: ₹350 • Lifetime earned: ₹{(balance + 11200).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex flex-col items-end gap-1">
              <button
                id="watch-rewarded-ad-btn"
                type="button"
                onClick={() => setShowRewardedAd(true)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold flex items-center gap-1 transition active:scale-95 cursor-pointer"
                title="Watch Google AdMob Rewarded Ad to earn bonus payout"
              >
                <Gift className="w-3 h-3 text-amber-400" />
                <span>+₹10 Rewarded Ad</span>
              </button>
              {balance === 0 && (
                <button
                  type="button"
                  onClick={handleTopUpSimulation}
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline font-semibold flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Top Up (Test)
                </button>
              )}
            </div>
          </div>

          {/* UPI ID Setup / Quick Edit */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-neutral-300">
              <span className="text-[11px] text-neutral-400">Payout UPI ID:</span>
              {isEditingUpi ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempUpi}
                    onChange={(e) => setTempUpi(e.target.value)}
                    className="bg-black/50 border border-emerald-500/60 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tempUpi.trim()) setUpiId(tempUpi.trim());
                      setIsEditingUpi(false);
                    }}
                    className="p-1 rounded bg-emerald-600 text-white"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <span className="font-mono text-emerald-300 font-semibold">{upiId}</span>
              )}
            </div>

            {!isEditingUpi && (
              <button
                type="button"
                onClick={() => {
                  setTempUpi(upiId);
                  setIsEditingUpi(true);
                }}
                className="text-[11px] text-neutral-400 hover:text-white underline"
              >
                Change
              </button>
            )}
          </div>

          {/* UPI Payout CTA Button - Locked until both 2,000 followers and 2,000 watch hours are 100% achieved */}
          <div className="space-y-2">
            {!isPayoutUnlocked ? (
              <>
                <button
                  id="simulated-upi-payout-btn"
                  type="button"
                  disabled
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-bold text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 cursor-not-allowed opacity-80"
                >
                  <Lock className="w-4 h-4 text-amber-500" />
                  <span>UPI Payout Application Locked</span>
                </button>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                  <div className="space-y-0.5">
                    <p className="font-bold">Monetization Criteria Not Yet Met:</p>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
                      UPI Payouts require <strong>2,000 followers</strong> ({followersRemaining.toLocaleString()} remaining) and <strong>2,000 watch hours</strong> ({watchHoursRemaining.toLocaleString()} remaining) before you can apply.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <button
                id="simulated-upi-payout-btn"
                type="button"
                disabled={balance <= 0 || isProcessingPayout}
                onClick={handleExecutePayout}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-neutral-950 font-bold text-xs sm:text-sm shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingPayout ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Instant UPI Payout...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Instant UPI Payout (तुरंत बैंक खाते में निकालें)</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Success Banner */}
          {payoutSuccessMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
              <span>{payoutSuccessMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. MONETIZATION POLICY & ELIGIBILITY TRACKER (2,000 FOLLOWERS & 2,000 WATCH HOURS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Monetization Eligibility (पात्रता स्थिति)
            </h3>
            <p className="text-[11px] text-neutral-500">
              Policy Target: 2,000 Followers & 2,000 Watch Hours
            </p>
          </div>
          {isPayoutUnlocked ? (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 100% Achieved
            </span>
          ) : (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Locked
            </span>
          )}
        </div>

        {/* Card 1: 2,000 Followers Target */}
        <div
          id="monetization-followers-card"
          className={`p-3.5 rounded-xl border bg-white dark:bg-neutral-900 transition ${
            effectiveFollowers >= TARGET_FOLLOWERS
              ? 'border-emerald-500/40 dark:border-emerald-500/30'
              : 'border-neutral-200 dark:border-neutral-800'
          } shadow-xs space-y-2.5`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs ${
                  effectiveFollowers >= TARGET_FOLLOWERS
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                }`}
              >
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    Target 1: 2,000 Followers (फॉलोअर्स)
                  </h4>
                  {effectiveFollowers >= TARGET_FOLLOWERS ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> UNLOCKED
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 flex items-center gap-0.5">
                      <Lock className="w-3 h-3" /> IN PROGRESS
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                  Build community trust & reach active viewers
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold text-neutral-900 dark:text-white">
              {followersPct}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                effectiveFollowers >= TARGET_FOLLOWERS
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-sky-500 to-amber-500'
              }`}
              style={{ width: `${followersPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px]">
            {followersRemaining === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 2,000 followers target 100% achieved!
              </span>
            ) : (
              <span className="text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                <span>🎯</span>
                <strong>{followersRemaining.toLocaleString()}</strong> followers remaining to unlock
              </span>
            )}
            <span className="text-neutral-400 font-mono text-[10px]">
              {effectiveFollowers.toLocaleString()} / 2,000
            </span>
          </div>
        </div>

        {/* Card 2: 2,000 Watch Hours Target */}
        <div
          id="monetization-watch-hours-card"
          className={`p-3.5 rounded-xl border bg-white dark:bg-neutral-900 transition ${
            effectiveWatchHours >= TARGET_WATCH_HOURS
              ? 'border-emerald-500/40 dark:border-emerald-500/30'
              : 'border-neutral-200 dark:border-neutral-800'
          } shadow-xs space-y-2.5`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs ${
                  effectiveWatchHours >= TARGET_WATCH_HOURS
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                }`}
              >
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    Target 2: 2,000 Watch Hours (वॉच आवर्स)
                  </h4>
                  {effectiveWatchHours >= TARGET_WATCH_HOURS ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> UNLOCKED
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 flex items-center gap-0.5">
                      <Lock className="w-3 h-3" /> IN PROGRESS
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                  Accumulated total viewing duration across reels & videos
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold text-neutral-900 dark:text-white">
              {watchHoursPct}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                effectiveWatchHours >= TARGET_WATCH_HOURS
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-amber-500 to-rose-500'
              }`}
              style={{ width: `${watchHoursPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px]">
            {watchHoursRemaining === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 2,000 watch hours target 100% achieved!
              </span>
            ) : (
              <span className="text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                <span>⏱️</span>
                <strong>{watchHoursRemaining.toLocaleString()}</strong> watch hours remaining to unlock
              </span>
            )}
            <span className="text-neutral-400 font-mono text-[10px]">
              {effectiveWatchHours.toLocaleString()} / 2,000 hrs
            </span>
          </div>
        </div>

        {/* Card 3: Instant Day-1 Shagun Tipping (0 Followers bonus) */}
        <div
          id="monetization-level-1-card"
          className="p-3.5 rounded-xl border bg-white dark:bg-neutral-900 border-emerald-500/30 shadow-xs space-y-2"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    Day-1 Shagun & QR Tips (0 Followers)
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> ACTIVE
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Instant UPI Shagun & Tipping Enabled 🎁
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              100%
            </span>
          </div>

          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Receive direct viewer tips via Google Pay, PhonePe, Paytm, and BHIM QR codes with 0% platform commission from your very first day.
          </p>
        </div>
      </div>

      {/* 3. RECENT TIP & SHAGUN TRANSACTIONS */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5 text-amber-500" />
            Recent Tip Transactions (हालिया शगुन व आय)
          </h3>
          <span className="text-[10px] text-neutral-400">
            {transactions.length} transactions
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 p-6 text-center bg-white/50 dark:bg-neutral-900/50">
            <Gift className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-60" />
            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Abhi koi transaction nahi hai
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              Jab viewers aapko UPI Shagun ya tips bhejenge, toh unki details yahan dikhengi.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800/80 bg-white dark:bg-neutral-900 overflow-hidden">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <img
                      src={tx.avatar}
                      alt={tx.from}
                      className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                    />
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                        tx.type === 'credit'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500 text-black'
                      }`}
                    >
                      {tx.type === 'credit' ? '+' : '↑'}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                        @{tx.from}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-medium">
                        via {tx.app}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 truncate">{tx.note}</p>
                    <span className="text-[10px] text-neutral-400 block">{tx.date}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span
                    className={`text-xs font-bold font-mono ${
                      tx.type === 'credit'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Settled
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AdMob Rewarded Video Ad Modal */}
      {showRewardedAd && (
        <AdMobRewardedAdModal
          isOpen={showRewardedAd}
          onClose={() => setShowRewardedAd(false)}
          onRewardEarned={handleRewardedAdCompleted}
          rewardLabel="₹10 Creator Payout Bonus"
          rewardAmount={10}
        />
      )}
    </div>
  );
};
