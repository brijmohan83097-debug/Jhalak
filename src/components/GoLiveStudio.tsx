import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Users,
  Heart,
  Send,
  Gift,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { User } from '../types';
import confetti from 'canvas-confetti';

interface GoLiveStudioProps {
  currentUser: User;
  onClose: () => void;
  onTipCreator?: (amount: number) => void;
}

interface LiveComment {
  id: string;
  username: string;
  avatar?: string;
  text: string;
  isTip?: boolean;
  tipAmount?: number;
}

interface FloatingHeart {
  id: number;
  x: number;
  color: string;
  emoji: string;
}

const HEART_COLORS = ['#ec4899', '#f43f5e', '#ef4444', '#f59e0b', '#8b5cf6', '#10b981'];
const HEART_EMOJIS = ['❤️', '💖', '🔥', '✨', '💛', '🎉'];

export const GoLiveStudio: React.FC<GoLiveStudioProps> = ({
  currentUser,
  onClose,
}) => {
  const [streamStage, setStreamStage] = useState<'preview' | 'live' | 'ended'>('preview');
  const [streamTitle, setStreamTitle] = useState('Chit-Chat with Fans & Q&A ✨');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [beautyFilter, setBeautyFilter] = useState(true);

  // Live broadcast stats - Real counters starting at 0
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [viewerCount] = useState(1);
  const [peakViewers] = useState(1);
  const [heartsCount, setHeartsCount] = useState(0);
  const [totalShagun] = useState(0);

  // Real user and audience comments only
  const [comments, setComments] = useState<LiveComment[]>([
    { id: '1', username: 'jhalak_official', text: 'Welcome to Jhalak Live Studio! Chat with real followers in real time 🌟' },
  ]);
  const [myCommentInput, setMyCommentInput] = useState('');
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const nextHeartId = useRef(0);

  // Video element and stream reference
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Camera initialization
  useEffect(() => {
    let active = true;

    async function setupCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: isFrontCamera ? 'user' : 'environment' },
            audio: true,
          });
          if (active && videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream;
            mediaStreamRef.current = stream;
          }
        }
      } catch {
        // In iframe or sandboxed container without hardware camera, fallback to simulated stream
      }
    }

    if (streamStage !== 'ended') {
      setupCamera();
    }

    return () => {
      active = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isFrontCamera, streamStage]);

  // Broadcast duration timer
  useEffect(() => {
    if (streamStage !== 'live') return;

    const timer = setInterval(() => {
      setDurationSeconds((s) => s + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [streamStage]);

  // Auto-scroll comments
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const spawnHearts = (count = 1) => {
    for (let i = 0; i < count; i++) {
      const id = ++nextHeartId.current;
      const x = Math.random() * 60 + 20; // 20% to 80%
      const color = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
      const emoji = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)];

      setFloatingHearts((prev) => [...prev.slice(-20), { id, x, color, emoji }]);
      setHeartsCount((c) => c + 1);

      // Remove after animation finishes
      setTimeout(() => {
        setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
      }, 2200);
    }
  };

  const handleStartStream = () => {
    setStreamStage('live');
    setDurationSeconds(0);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.5 },
      });
    } catch {
      // ignore
    }
  };

  const handleEndStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    setStreamStage('ended');
  };

  const handleSendMyComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myCommentInput.trim()) return;

    setComments((prev) => [
      ...prev,
      {
        id: `my-${Date.now()}`,
        username: currentUser.username,
        text: myCommentInput.trim(),
      },
    ]);
    setMyCommentInput('');
    spawnHearts(1);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      id="go-live-container"
      className="relative w-full h-full min-h-[520px] max-h-[82vh] bg-black text-white rounded-2xl overflow-hidden flex flex-col select-none"
    >
      {/* ================= STAGE 1: PREVIEW SCREEN ================= */}
      {streamStage === 'preview' && (
        <div className="relative flex-1 flex flex-col justify-between p-4 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black">
          {/* Simulated or Real Video Background */}
          <div className="absolute inset-0 overflow-hidden">
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-transform ${
                isFrontCamera ? 'scale-x-[-1]' : ''
              } ${beautyFilter ? 'brightness-105 contrast-105 saturate-110' : ''}`}
            />
            {/* Fallback visual avatar camera feed if real webcam is not permitted */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-28 h-28 rounded-full border-4 border-rose-500/80 p-1 mb-3 shadow-2xl relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full rounded-full object-cover"
                />
                <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs">
                  🔴
                </span>
              </div>
              <h3 className="font-extrabold text-lg text-white drop-shadow-md">
                @{currentUser.username} Live Studio
              </h3>
              <p className="text-xs text-neutral-300 drop-shadow-sm flex items-center gap-1.5 mt-0.5">
                <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span>Ready to connect with your Jhalak followers</span>
              </p>
            </div>
          </div>

          {/* Top Controls */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                Live Setup
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBeautyFilter((b) => !b)}
                className={`p-2 rounded-full backdrop-blur-md border transition ${
                  beautyFilter
                    ? 'bg-rose-500 text-white border-rose-400'
                    : 'bg-black/50 text-white/80 border-white/20 hover:bg-black/70'
                }`}
                title="Glow / Beauty Filter"
              >
                <Sparkles className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsMicMuted((m) => !m)}
                className={`p-2 rounded-full backdrop-blur-md border transition ${
                  isMicMuted
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-black/50 text-white/80 border-white/20 hover:bg-black/70'
                }`}
                title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setIsFrontCamera((f) => !f)}
                className="p-2 rounded-full bg-black/50 backdrop-blur-md border border-white/20 hover:bg-black/70 text-white/80 transition"
                title="Flip Camera"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Broadcast Config & Go Live Button */}
          <div className="relative z-10 w-full max-w-lg mx-auto space-y-3 pt-4">
            <div className="bg-black/70 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 shadow-2xl">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                Stream Title & Topic
              </label>
              <input
                type="text"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder="Give your live stream a title..."
                className="w-full py-2 px-3 bg-white/10 rounded-xl border border-white/20 text-sm font-semibold text-white placeholder:text-white/40 focus:outline-none focus:border-rose-500"
              />

              <div className="flex items-center gap-2 mt-2 text-[11px] text-neutral-300">
                <Users className="w-3.5 h-3.5 text-rose-400" />
                <span>Audience: Public • All followers will get notified 🔔</span>
              </div>
            </div>

            <button
              type="button"
              id="start-go-live-button"
              onClick={handleStartStream}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-red-500 to-amber-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-rose-600/40 hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Radio className="w-5 h-5 animate-pulse" />
              <span>Go Live</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= STAGE 2: ACTIVE LIVE BROADCAST ================= */}
      {streamStage === 'live' && (
        <div className="relative flex-1 flex flex-col justify-between p-3 sm:p-4 overflow-hidden">
          {/* Video stream canvas */}
          <div className="absolute inset-0 overflow-hidden">
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                isFrontCamera ? 'scale-x-[-1]' : ''
              } ${beautyFilter ? 'brightness-105 contrast-105 saturate-110' : ''}`}
            />
            {/* Fallback ambient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none" />
          </div>

          {/* Floating Hearts Layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {floatingHearts.map((heart) => (
              <div
                key={heart.id}
                style={{ left: `${heart.x}%` }}
                className="absolute bottom-16 text-2xl animate-float-up duration-2000"
              >
                {heart.emoji}
              </div>
            ))}
          </div>

          {/* TOP BAR: LIVE badge, viewer count, timer, end stream */}
          <div className="relative z-30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Pulsing LIVE badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-600/50 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>LIVE</span>
              </div>

              {/* Viewer Counter */}
              <div
                id="live-viewer-count"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-semibold text-white/90"
              >
                <Eye className="w-3.5 h-3.5 text-rose-400" />
                <span>{viewerCount.toLocaleString()}</span>
              </div>

              {/* Broadcast duration timer */}
              <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-mono text-white/90">
                {formatTime(durationSeconds)}
              </div>
            </div>

            {/* End Stream Button */}
            <button
              type="button"
              id="end-live-broadcast-button"
              onClick={handleEndStream}
              className="px-3 py-1 rounded-full bg-rose-700/80 hover:bg-rose-700 text-white font-bold text-xs border border-rose-500/50 shadow-md transition active:scale-95"
            >
              End Live
            </button>
          </div>

          {/* MIDDLE: Shagun Tips Ticker if active */}
          {totalShagun > 0 && (
            <div className="relative z-30 self-start mt-2">
              <div className="flex items-center gap-2 py-1 px-3 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-bold animate-in slide-in-from-left">
                <Gift className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span>Total Shagun Tips: ₹{totalShagun}</span>
              </div>
            </div>
          )}

          {/* BOTTOM SECTION: Live comments overlay + Chat Input + Action Buttons */}
          <div className="relative z-30 w-full mt-auto space-y-3 pt-6">
            {/* Live Comments Overlay */}
            <div className="w-full max-w-sm max-h-44 overflow-y-auto space-y-1.5 pr-2 no-scrollbar mask-gradient">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-2 rounded-xl text-xs backdrop-blur-md border transition animate-in slide-in-from-bottom-2 ${
                    comment.isTip
                      ? 'bg-amber-500/25 border-amber-500/50 text-amber-200'
                      : 'bg-black/60 border-white/10 text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-bold text-rose-400">@{comment.username}</span>
                    {comment.isTip && (
                      <span className="text-[10px] bg-amber-400 text-black font-extrabold px-1.5 py-0.2 rounded-full">
                        ₹{comment.tipAmount} Shagun
                      </span>
                    )}
                  </div>
                  <p className="text-white/90 text-[11px] leading-snug">{comment.text}</p>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>

            {/* Chat Input & Floating Heart Reaction Controls */}
            <div className="flex items-center gap-2">
              <form onSubmit={handleSendMyComment} className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  id="live-chat-input"
                  value={myCommentInput}
                  onChange={(e) => setMyCommentInput(e.target.value)}
                  placeholder="Say something to your audience..."
                  className="flex-1 py-2 px-3 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs text-white placeholder:text-white/50 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  disabled={!myCommentInput.trim()}
                  className="p-2 rounded-full bg-rose-600 disabled:opacity-40 text-white transition active:scale-95 shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {/* Floating Hearts Button */}
              <button
                type="button"
                id="live-floating-heart-btn"
                onClick={() => spawnHearts(3)}
                className="p-2.5 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-lg active:scale-125 transition-transform flex items-center justify-center cursor-pointer"
                title="Tap to send live hearts"
              >
                <Heart className="w-5 h-5 fill-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= STAGE 3: BROADCAST ENDED SUMMARY ================= */}
      {streamStage === 'ended' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5 bg-gradient-to-b from-neutral-900 to-black animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 text-rose-500 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-bold">Live Stream Ended</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Your broadcast session summary on Jhalak
            </p>
          </div>

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
            <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
              <span className="text-neutral-400 text-[11px]">Stream Time</span>
              <p className="text-base font-bold text-white mt-0.5">
                {formatTime(durationSeconds)}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
              <span className="text-neutral-400 text-[11px]">Peak Viewers</span>
              <p className="text-base font-bold text-rose-400 mt-0.5">
                {peakViewers.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
              <span className="text-neutral-400 text-[11px]">Hearts Sent</span>
              <p className="text-base font-bold text-pink-400 mt-0.5">
                {heartsCount.toLocaleString()} ❤️
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
              <span className="text-neutral-400 text-[11px]">Shagun Earned</span>
              <p className="text-base font-bold text-amber-400 mt-0.5">
                ₹{totalShagun} 🎁
              </p>
            </div>
          </div>

          <div className="w-full max-w-xs pt-2">
            <button
              type="button"
              id="close-go-live-summary-btn"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 text-white font-bold text-xs shadow-lg transition active:scale-98"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
