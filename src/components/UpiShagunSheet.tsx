import React, { useState } from 'react';
import {
  Gift,
  X,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Send,
  Heart,
  Smartphone,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface UpiShagunSheetProps {
  isOpen: boolean;
  onClose: () => void;
  creator: {
    username: string;
    name?: string;
    avatar?: string;
  };
  onTipSent?: (amount: number, app: string, note?: string) => void;
}

interface UpiApp {
  id: string;
  name: string;
  subtext: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconBg: string;
}

const PRESET_AMOUNTS = [
  { amount: 10, label: 'Chai Shagun', icon: '☕' },
  { amount: 50, label: 'Mithai Shagun', icon: '🍬' },
  { amount: 100, label: 'Super Shagun', icon: '⭐' },
  { amount: 500, label: 'Grand Shagun', icon: '👑' },
];

const UPI_APPS: UpiApp[] = [
  {
    id: 'gpay',
    name: 'Google Pay',
    subtext: 'Instant UPI transfer',
    bgColor: 'bg-white dark:bg-neutral-800',
    borderColor: 'border-blue-500/40 hover:border-blue-500',
    textColor: 'text-neutral-900 dark:text-white',
    iconBg: 'bg-gradient-to-tr from-blue-500 via-green-500 to-amber-500 text-white font-bold',
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    subtext: 'Fast & secure UPI',
    bgColor: 'bg-white dark:bg-neutral-800',
    borderColor: 'border-purple-500/40 hover:border-purple-500',
    textColor: 'text-neutral-900 dark:text-white',
    iconBg: 'bg-[#5f259f] text-white font-bold',
  },
  {
    id: 'paytm',
    name: 'Paytm UPI',
    subtext: 'Paytm Payments Bank',
    bgColor: 'bg-white dark:bg-neutral-800',
    borderColor: 'border-sky-500/40 hover:border-sky-500',
    textColor: 'text-neutral-900 dark:text-white',
    iconBg: 'bg-[#002e6e] text-[#00baf2] font-black',
  },
];

const SHAGUN_QUICK_NOTES = [
  'Loved your reel! ✨',
  'Keep shining! 🌟',
  'Chai on me ☕',
  'Pure talent! 🔥',
  'Namaste from a fan ❤️',
];

export const UpiShagunSheet: React.FC<UpiShagunSheetProps> = ({
  isOpen,
  onClose,
  creator,
  onTipSent,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [selectedApp, setSelectedApp] = useState<string>('gpay');
  const [note, setNote] = useState<string>('Loved your reel! ✨');
  const [paymentStage, setPaymentStage] = useState<'idle' | 'processing' | 'success'>('idle');
  const [txnRef, setTxnRef] = useState<string>('');

  if (!isOpen) return null;

  const currentAmount = isCustomMode ? Math.max(1, Number(customAmount) || 0) : selectedAmount;

  const fireConfetti = () => {
    try {
      // Multiple bursts for authentic celebration
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6, x: 0.5 },
        colors: ['#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#3b82f6'],
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0.2, y: 0.65 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 0.8, y: 0.65 },
        });
      }, 200);
    } catch {
      // Fallback if canvas is constrained
    }
  };

  const handleSendTip = () => {
    if (currentAmount <= 0) return;

    setPaymentStage('processing');
    const simulatedRef = `UPI/${Date.now().toString().slice(-8)}/${Math.floor(1000 + Math.random() * 9000)}`;
    setTxnRef(simulatedRef);

    setTimeout(() => {
      setPaymentStage('success');
      fireConfetti();
      onTipSent?.(currentAmount, selectedApp, note);
    }, 1200);
  };

  const handleReset = () => {
    setPaymentStage('idle');
    setIsCustomMode(false);
    setCustomAmount('');
    onClose();
  };

  return (
    <div
      id="upi-shagun-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={handleReset}
    >
      <div
        id="upi-shagun-sheet"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom duration-300"
      >
        {/* Decorative Top Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600" />

        {/* Sheet Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/15 via-rose-500/15 to-purple-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/20">
              <Gift className="w-5 h-5 animate-bounce [animation-duration:2.5s]" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight flex items-center gap-1.5">
                <span>UPI Shagun Tip</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                  Zero Fee
                </span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Support creators directly via verified Indian UPI
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sheet Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {paymentStage === 'success' ? (
            /* Success View with Confetti Celebration */
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="absolute -top-1 -right-1 text-2xl animate-ping [animation-duration:2s]">
                  ✨
                </div>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400">
                  Shagun Sent Successfully!
                </span>
                <h4 className="text-3xl font-extrabold mt-1 text-neutral-900 dark:text-white">
                  ₹{currentAmount}
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Sent to <span className="font-bold text-neutral-900 dark:text-white">@{creator.username}</span> via{' '}
                  {UPI_APPS.find((a) => a.id === selectedApp)?.name}
                </p>
              </div>

              {/* Shagun Note Card */}
              {note && (
                <div className="w-full p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-left">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Your Shagun Note:</span>
                  </div>
                  <p className="text-xs text-neutral-800 dark:text-neutral-200 italic">
                    "{note}"
                  </p>
                </div>
              )}

              {/* Transaction Metadata */}
              <div className="w-full p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 text-left text-xs space-y-1">
                <div className="flex justify-between text-neutral-400 text-[11px]">
                  <span>Transaction Ref:</span>
                  <span className="font-mono text-neutral-600 dark:text-neutral-300">{txnRef}</span>
                </div>
                <div className="flex justify-between text-neutral-400 text-[11px]">
                  <span>NPCI Status:</span>
                  <span className="text-emerald-500 font-semibold">SUCCESS (Settled)</span>
                </div>
              </div>

              <div className="w-full pt-2">
                <button
                  id="upi-shagun-done-btn"
                  onClick={handleReset}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 text-white font-bold text-sm shadow-md hover:opacity-95 transition"
                >
                  Done (धन्यवाद)
                </button>
              </div>
            </div>
          ) : paymentStage === 'processing' ? (
            /* Processing simulation */
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                <Smartphone className="w-6 h-6 text-amber-500 absolute inset-0 m-auto" />
              </div>
              <div>
                <h4 className="font-bold text-base">Processing UPI Shagun...</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Connecting to {UPI_APPS.find((a) => a.id === selectedApp)?.name} • NPCI Network
                </p>
              </div>
            </div>
          ) : (
            /* Normal Tipping Form */
            <>
              {/* Creator Card */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                {creator.avatar ? (
                  <img
                    src={creator.avatar}
                    alt={creator.username}
                    className="w-12 h-12 rounded-full object-cover border border-amber-500/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center font-bold text-lg">
                    {creator.username[0]?.toUpperCase() || 'C'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm truncate">
                      {creator.name || creator.username}
                    </h4>
                    <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded">
                      Creator
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    @{creator.username} • Verified UPI VPA
                  </p>
                </div>
              </div>

              {/* Shagun Amount Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                  Select Shagun Amount
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_AMOUNTS.map((preset) => {
                    const isSelected = !isCustomMode && selectedAmount === preset.amount;
                    return (
                      <button
                        key={preset.amount}
                        type="button"
                        id={`shagun-preset-${preset.amount}`}
                        onClick={() => {
                          setIsCustomMode(false);
                          setSelectedAmount(preset.amount);
                        }}
                        className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border transition active:scale-95 ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shadow-sm ring-2 ring-amber-500/20'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <span className="text-base mb-0.5">{preset.icon}</span>
                        <span className="text-sm font-extrabold">₹{preset.amount}</span>
                        <span className="text-[9px] text-neutral-400 truncate mt-0.5 font-medium">
                          {preset.label.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amount Button/Input */}
                <div className="mt-2.5">
                  {isCustomMode ? (
                    <div className="flex items-center gap-2 p-2 rounded-xl border-2 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
                      <span className="text-lg font-bold text-amber-500 pl-2">₹</span>
                      <input
                        id="shagun-custom-amount-input"
                        type="number"
                        min="1"
                        max="50000"
                        placeholder="Enter amount (e.g. 250)"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        autoFocus
                        className="flex-1 bg-transparent text-sm font-bold text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setIsCustomMode(false)}
                        className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 px-2 py-1"
                      >
                        Presets
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      id="shagun-toggle-custom-btn"
                      onClick={() => {
                        setIsCustomMode(true);
                        setCustomAmount('200');
                      }}
                      className="w-full text-center py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      + Enter Custom Amount
                    </button>
                  )}
                </div>
              </div>

              {/* Shagun Note & Quick Chips */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                  Shagun Note (शुभकामनाएं)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={100}
                    placeholder="Add a sweet message for the creator..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Quick suggestion chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 no-scrollbar">
                  {SHAGUN_QUICK_NOTES.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setNote(chip)}
                      className={`text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full border transition ${
                        note === chip
                          ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:border-neutral-300'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select UPI App */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                  Pay with UPI App
                </label>
                <div className="space-y-2">
                  {UPI_APPS.map((app) => {
                    const isSelected = selectedApp === app.id;
                    return (
                      <button
                        key={app.id}
                        type="button"
                        id={`upi-app-${app.id}`}
                        onClick={() => setSelectedApp(app.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl border transition active:scale-[0.99] text-left ${
                          app.bgColor
                        } ${
                          isSelected
                            ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs shadow-xs ${app.iconBg}`}
                          >
                            {app.id === 'gpay'
                              ? 'GPay'
                              : app.id === 'phonepe'
                              ? 'पे'
                              : 'Paytm'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-neutral-900 dark:text-white">
                              {app.name}
                            </p>
                            <p className="text-[10px] text-neutral-400">{app.subtext}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            Fast UPI
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-amber-500 bg-amber-500 text-white'
                                : 'border-neutral-300 dark:border-neutral-600'
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Security & NPCI Assurance */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>100% Secure • Simulated UPI Payments • No Extra Charges</span>
              </div>

              {/* Pay Button */}
              <div className="pt-2">
                <button
                  type="button"
                  id="send-shagun-pay-btn"
                  disabled={currentAmount <= 0}
                  onClick={handleSendTip}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 hover:opacity-95 text-white font-extrabold text-sm shadow-lg shadow-amber-500/20 active:scale-[0.99] transition flex items-center justify-center gap-2"
                >
                  <Gift className="w-4 h-4" />
                  <span>
                    Send ₹{currentAmount} Shagun to @{creator.username}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
