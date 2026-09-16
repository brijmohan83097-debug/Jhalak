import React, { useState } from 'react';
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
} from 'lucide-react';
import { User } from '../types';

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
  currentUser: User;
}

export const CreatorMonetizationView: React.FC<CreatorMonetizationViewProps> = ({
  currentUser,
}) => {
  // Balance & Payout states
  const [balance, setBalance] = useState(4850);
  const [upiId, setUpiId] = useState(`${currentUser.username.toLowerCase()}@oksbi`);
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [tempUpi, setTempUpi] = useState(upiId);
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [payoutSuccessMessage, setPayoutSuccessMessage] = useState<string | null>(null);

  // Simulation mode for testing all milestone stages
  const [simProfile, setSimProfile] = useState<'current' | 'level1' | 'level2_prog' | 'level3_prog'>('current');

  // Realistic transactions initial list
  const [transactions, setTransactions] = useState<TipTransaction[]>([
    {
      id: 'tx-1',
      from: 'ananya_wanderer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      amount: 51,
      app: 'Google Pay',
      note: 'Chai Shagun for the Jaipur pottery post! ☕✨',
      date: 'Today, 2:40 PM',
      type: 'credit',
    },
    {
      id: 'tx-2',
      from: 'kabir_captures',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      amount: 101,
      app: 'PhonePe',
      note: 'Super Shagun! Loved the artisan story 🙏',
      date: 'Yesterday, 6:15 PM',
      type: 'credit',
    },
    {
      id: 'tx-3',
      from: 'priya_visuals',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      amount: 251,
      app: 'Paytm',
      note: 'Keep inspiring with Indian cultural heritage 🎨',
      date: '3 days ago',
      type: 'credit',
    },
    {
      id: 'tx-4',
      from: 'meera_bangalore',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100',
      amount: 501,
      app: 'BHIM UPI',
      note: 'Shagun for the brass handicraft collection 🪔',
      date: '5 days ago',
      type: 'credit',
    },
  ]);

  // Determine followers and views based on simulation or real user
  const effectiveFollowers =
    simProfile === 'current'
      ? currentUser.followersCount || 14820
      : simProfile === 'level1'
      ? 0
      : simProfile === 'level2_prog'
      ? 65
      : 340;

  const effectiveViews =
    simProfile === 'current'
      ? 182500
      : simProfile === 'level1'
      ? 0
      : simProfile === 'level2_prog'
      ? 650
      : 6200;

  // Level 1: 0 followers (Always unlocked!)
  const level1Unlocked = true;

  // Level 2: 100 Followers & 1,000 Views
  const level2FollowersPct = Math.min(100, Math.round((effectiveFollowers / 100) * 100));
  const level2ViewsPct = Math.min(100, Math.round((effectiveViews / 1000) * 100));
  const level2Unlocked = effectiveFollowers >= 100 && effectiveViews >= 1000;

  // Level 3: 500 Followers & 10,000 Views
  const level3FollowersPct = Math.min(100, Math.round((effectiveFollowers / 500) * 100));
  const level3ViewsPct = Math.min(100, Math.round((effectiveViews / 10000) * 100));
  const level3Unlocked = effectiveFollowers >= 500 && effectiveViews >= 10000;

  // Simulated Instant UPI Payout
  const handleExecutePayout = () => {
    if (balance <= 0) return;
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

  return (
    <div id="creator-monetization-view" className="space-y-4 pb-2">
      {/* Simulation Stage Quick Selector (Helps test all milestone levels easily) */}
      <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Milestone Simulator (परीक्षण मोड):
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            {effectiveFollowers.toLocaleString()} followers • {effectiveViews.toLocaleString()} views
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setSimProfile('current')}
            className={`text-[10px] px-2 py-1 rounded-lg font-medium transition ${
              simProfile === 'current'
                ? 'bg-amber-500 text-black font-bold shadow-xs'
                : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
            }`}
          >
            🌟 My Profile (All Unlocked)
          </button>
          <button
            type="button"
            onClick={() => setSimProfile('level1')}
            className={`text-[10px] px-2 py-1 rounded-lg font-medium transition ${
              simProfile === 'level1'
                ? 'bg-amber-500 text-black font-bold shadow-xs'
                : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
            }`}
          >
            🌱 New Creator (0 Followers)
          </button>
          <button
            type="button"
            onClick={() => setSimProfile('level2_prog')}
            className={`text-[10px] px-2 py-1 rounded-lg font-medium transition ${
              simProfile === 'level2_prog'
                ? 'bg-amber-500 text-black font-bold shadow-xs'
                : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
            }`}
          >
            📈 Level 2 In-Progress (65 F / 650 V)
          </button>
          <button
            type="button"
            onClick={() => setSimProfile('level3_prog')}
            className={`text-[10px] px-2 py-1 rounded-lg font-medium transition ${
              simProfile === 'level3_prog'
                ? 'bg-amber-500 text-black font-bold shadow-xs'
                : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
            }`}
          >
            💎 Level 3 In-Progress (340 F / 6.2K V)
          </button>
        </div>
      </div>

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

          {/* Simulated UPI Payout CTA Button */}
          <div>
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
                  <span>Simulated UPI Payout (तुरंत बैंक खाते में निकालें)</span>
                </>
              )}
            </button>
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

      {/* 2. LOW THRESHOLD ELIGIBILITY TRACKER */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Eligibility Tracker (पात्रता स्थिति)
            </h3>
            <p className="text-[11px] text-neutral-500">
              Low threshold milestones crafted for every Indian creator
            </p>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full font-bold">
            Zero Barriers
          </span>
        </div>

        {/* Milestone Level 1: 0 Followers (Instant UPI Shagun & Tipping enabled) */}
        <div
          id="monetization-level-1-card"
          className="p-3.5 rounded-xl border bg-white dark:bg-neutral-900 border-emerald-500/40 dark:border-emerald-500/30 shadow-xs space-y-2.5"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs">
                L1
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    Level 1 (0 Followers)
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
            Enabled from day 1 for all creators! Receive tips via Google Pay, PhonePe, Paytm, and BHIM QR codes with 0 platform fees.
          </p>

          {/* Progress Bar (Always 100%) */}
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-500 h-2 rounded-full w-full" />
          </div>

          <div className="flex items-center gap-2 text-[10px] text-neutral-400">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              ✓ 0 Followers requirement met
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              ✓ Direct UPI Payments Active
            </span>
          </div>
        </div>

        {/* Milestone Level 2: 100 Followers & 1K views (Rising Star Creator badge) */}
        <div
          id="monetization-level-2-card"
          className={`p-3.5 rounded-xl border bg-white dark:bg-neutral-900 transition ${
            level2Unlocked
              ? 'border-amber-500/40 dark:border-amber-500/30'
              : 'border-neutral-200 dark:border-neutral-800'
          } shadow-xs space-y-2.5`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs ${
                  level2Unlocked
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                }`}
              >
                L2
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    Level 2 (100 Followers & 1K views)
                  </h4>
                  {level2Unlocked ? (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> UNLOCKED
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                      <Lock className="w-3 h-3" /> IN PROGRESS
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  Rising Star Creator Badge 🌟
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
              {level2Unlocked ? '100%' : `${Math.round((level2FollowersPct + level2ViewsPct) / 2)}%`}
            </span>
          </div>

          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Perks: Official Rising Star badge on profile, featured ranking in Explore, and priority discovery for regional reels.
          </p>

          {/* Progress Bars for Followers and Views */}
          <div className="space-y-2 pt-0.5">
            {/* Followers Tracker */}
            <div>
              <div className="flex justify-between text-[10px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                <span>Followers (फॉलोअर्स):</span>
                <span>
                  {effectiveFollowers.toLocaleString()} / 100{' '}
                  {effectiveFollowers >= 100 && '✓'}
                </span>
              </div>
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${level2FollowersPct}%` }}
                />
              </div>
            </div>

            {/* Views Tracker */}
            <div>
              <div className="flex justify-between text-[10px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                <span>Total Views (कुल व्यूज):</span>
                <span>
                  {effectiveViews.toLocaleString()} / 1,000{' '}
                  {effectiveViews >= 1000 && '✓'}
                </span>
              </div>
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${level2ViewsPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Level 3: 500 Followers & 10K views (Full Ad Revenue Sharing & Blue Tick) */}
        <div
          id="monetization-level-3-card"
          className={`p-3.5 rounded-xl border bg-white dark:bg-neutral-900 transition ${
            level3Unlocked
              ? 'border-sky-500/40 dark:border-sky-500/30'
              : 'border-neutral-200 dark:border-neutral-800'
          } shadow-xs space-y-2.5`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs ${
                  level3Unlocked
                    ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                }`}
              >
                L3
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    Level 3 (500 Followers & 10K views)
                  </h4>
                  {level3Unlocked ? (
                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20 flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> UNLOCKED
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                      <Lock className="w-3 h-3" /> IN PROGRESS
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                  Full Ad Revenue Sharing & Blue Tick 💎
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
              {level3Unlocked ? '100%' : `${Math.round((level3FollowersPct + level3ViewsPct) / 2)}%`}
            </span>
          </div>

          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Perks: 55% in-stream Ad revenue share, Verified Blue Tick verification badge, and direct brand sponsorship contact hub.
          </p>

          {/* Progress Bars for Followers and Views */}
          <div className="space-y-2 pt-0.5">
            {/* Followers Tracker */}
            <div>
              <div className="flex justify-between text-[10px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                <span>Followers (फॉलोअर्स):</span>
                <span>
                  {effectiveFollowers.toLocaleString()} / 500{' '}
                  {effectiveFollowers >= 500 && '✓'}
                </span>
              </div>
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-sky-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${level3FollowersPct}%` }}
                />
              </div>
            </div>

            {/* Views Tracker */}
            <div>
              <div className="flex justify-between text-[10px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                <span>Total Views (कुल व्यूज):</span>
                <span>
                  {effectiveViews.toLocaleString()} / 10,000{' '}
                  {effectiveViews >= 10000 && '✓'}
                </span>
              </div>
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-sky-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${level3ViewsPct}%` }}
                />
              </div>
            </div>
          </div>
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
      </div>
    </div>
  );
};
