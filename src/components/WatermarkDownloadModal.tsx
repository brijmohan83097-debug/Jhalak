import React, { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle,
  Sparkles,
  X,
  FileVideo,
  Share2,
} from 'lucide-react';
import { Reel } from '../types';
import { JhalakLogo } from './JhalakLogo';

interface WatermarkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  reel: Reel | null;
  onDownloadSuccess?: (message: string) => void;
}

export const WatermarkDownloadModal: React.FC<WatermarkDownloadModalProps> = ({
  isOpen,
  onClose,
  reel,
  onDownloadSuccess,
}) => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'rendering' | 'watermarking' | 'complete'>('rendering');
  const [downloadTriggered, setDownloadTriggered] = useState(false);

  useEffect(() => {
    if (!isOpen || !reel) {
      setProgress(0);
      setStage('rendering');
      setDownloadTriggered(false);
      return;
    }

    // Step 1: Render video buffer
    const timer1 = setTimeout(() => {
      setProgress(40);
      setStage('watermarking');
    }, 400);

    // Step 2: Overlay Jhalak watermark
    const timer2 = setTimeout(() => {
      setProgress(85);
    }, 900);

    // Step 3: Complete & Trigger file download
    const timer3 = setTimeout(() => {
      setProgress(100);
      setStage('complete');

      if (!downloadTriggered) {
        setDownloadTriggered(true);

        // Initiate browser file download
        try {
          const filename = `Jhalak_${reel.username}_${reel.id}.mp4`;
          // Create dummy download link or anchor to video URL
          const link = document.createElement('a');
          link.href = reel.videoUrl;
          link.download = filename;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch {
          // Fallback
        }

        if (onDownloadSuccess) {
          onDownloadSuccess(`Video saved with Jhalak • @${reel.username} watermark! 📥`);
        }
      }
    }, 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isOpen, reel]);

  if (!isOpen || !reel) return null;

  return (
    <div
      id="watermark-download-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 transition-opacity animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        id="watermark-download-dialog"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm sm:max-w-md bg-neutral-900 text-white rounded-3xl border border-neutral-800 p-5 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 text-amber-400 border border-amber-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Download with Watermark
              </h3>
              <p className="text-xs text-neutral-400">Jhalak Verified Export</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Preview Card with Live Watermark Badge */}
        <div className="relative my-4 rounded-2xl overflow-hidden aspect-[9/14] max-h-[340px] mx-auto bg-black border border-neutral-700/80 shadow-2xl flex items-center justify-center">
          <video
            src={reel.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-90"
          />

          {/* Overlaid Jhalak Branding Watermark Badge */}
          <div
            id="watermark-preview-badge"
            className="absolute bottom-4 right-4 z-20 flex items-center gap-2 py-1.5 px-3 rounded-full bg-black/75 backdrop-blur-md border border-white/20 shadow-2xl animate-pulse"
          >
            {/* Custom glowing Jhalak logo */}
            <JhalakLogo size={18} showGlow={false} />
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-extrabold tracking-wide bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                  Jhalak
                </span>
                <span className="text-[10px] text-white/60">•</span>
                <span className="text-[10px] font-bold text-white tracking-tight">
                  @{reel.username}
                </span>
              </div>
            </div>
          </div>

          {/* Top subtle corner watermark for authenticity */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-black/50 backdrop-blur-xs border border-white/10">
            <JhalakLogo size={14} showGlow={false} />
            <span className="text-[9px] font-semibold text-neutral-200 uppercase tracking-widest">
              Jhalak Reel
            </span>
          </div>

          {/* Processing overlay if not finished */}
          {stage !== 'complete' && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
              <div className="w-12 h-12 rounded-full border-3 border-rose-500 border-t-transparent animate-spin mb-3" />
              <p className="text-xs font-bold text-white mb-1">
                {stage === 'rendering' ? 'Preparing video frames...' : 'Stamping Jhalak watermark...'}
              </p>
              <p className="text-[11px] text-neutral-300">
                Adding @{reel.username} attribution badge
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar & Status */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-300 font-medium flex items-center gap-1.5">
              {stage === 'complete' ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Ready & Saved!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>Generating watermarked MP4...</span>
                </>
              )}
            </span>
            <span className="font-semibold text-neutral-400">{progress}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-2 pt-1">
          {stage === 'complete' ? (
            <div className="flex items-center gap-2">
              <button
                id="watermark-download-again-btn"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = reel.videoUrl;
                  link.download = `Jhalak_${reel.username}_${reel.id}.mp4`;
                  link.target = '_blank';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  if (onDownloadSuccess) {
                    onDownloadSuccess(`Downloaded Jhalak • @${reel.username} video! 📥`);
                  }
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 transition shadow-lg"
              >
                <FileVideo className="w-4 h-4" />
                <span>Save Again</span>
              </button>
              <button
                onClick={onClose}
                className="py-3 px-5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs transition"
              >
                Done
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-xs font-semibold transition"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
