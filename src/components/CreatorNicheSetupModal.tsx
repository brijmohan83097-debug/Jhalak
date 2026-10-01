import React, { useState } from 'react';
import { Sparkles, Check, ArrowRight } from 'lucide-react';
import { ContentCategory, CREATOR_NICHES } from '../types';

interface CreatorNicheSetupModalProps {
  isOpen: boolean;
  currentNiche?: ContentCategory;
  onSaveNiche: (niche: ContentCategory) => void;
}

export const CreatorNicheSetupModal: React.FC<CreatorNicheSetupModalProps> = ({
  isOpen,
  currentNiche = 'Vlogging',
  onSaveNiche,
}) => {
  const [selectedNiche, setSelectedNiche] = useState<ContentCategory>(currentNiche);

  if (!isOpen) return null;

  const handleConfirm = () => {
    localStorage.setItem('jhalak_creator_niche', selectedNiche);
    onSaveNiche(selectedNiche);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-neutral-900 border border-white/15 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-white animate-in zoom-in-95 duration-200">
        {/* Glow Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full">
              First App Setup • Creator Niche
            </span>
            <h2 className="text-xl font-black text-white mt-1.5 tracking-tight">
              Choose Your Creator Niche 🎯
            </h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto leading-relaxed">
              Select your primary content category. This is saved to your creator profile and sets the default category for your future uploads.
            </p>
          </div>
        </div>

        {/* 6 Creator Niches Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {CREATOR_NICHES.map((niche) => {
            const isSelected = selectedNiche === niche.id;
            return (
              <button
                key={niche.id}
                type="button"
                onClick={() => setSelectedNiche(niche.id)}
                className={`relative p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-white/15 border-rose-400 ring-2 ring-rose-500/50 shadow-lg scale-[1.02]'
                    : 'bg-neutral-800/80 border-white/10 hover:bg-neutral-800 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{niche.emoji}</span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <span className="font-bold text-sm text-white mt-1">{niche.label}</span>
                <span className="text-[10px] text-neutral-400 line-clamp-1">{niche.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Sticky Action Button */}
        <button
          type="button"
          id="save-creator-niche-btn"
          onClick={handleConfirm}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 hover:opacity-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-2xl shadow-rose-500/30 active:scale-[0.98] transition cursor-pointer"
        >
          <span>Save & Start Creating 🚀</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
export default CreatorNicheSetupModal;
