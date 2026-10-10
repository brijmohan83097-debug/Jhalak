import React from 'react';

interface JhalakLogoProps {
  size?: number;
  className?: string;
  showGlow?: boolean;
  animate?: boolean;
}

/**
 * Jhalak Official Brand Logo
 * Displays the official 3D Tiranga blue squircle app icon badge:
 * - Royal Blue beveled squircle frame with ambient depth
 * - 3D Volumetric Indian Tiranga (Saffron, White, Emerald Green) ribbon 'J' loop
 * - Filmstrip slate with white play button
 * - Festive Indian folk dancer silhouettes & golden musical notes
 * - Sparkling 4-point stars & golden bokeh dust
 * - Metallic gold embossed "JHALAK" branding & crisp white "Reels: Made in India"
 */
export const JhalakLogo: React.FC<JhalakLogoProps> = ({
  size = 48,
  className = '',
  showGlow = false,
  animate = false,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none flex-shrink-0 aspect-square ${className} ${
        animate ? 'hover:scale-105 active:scale-95 transition-transform duration-300' : ''
      }`}
      style={{ width: size, height: size }}
    >
      {/* Optional Ambient Aura */}
      {showGlow && (
        <div
          className="absolute -inset-1.5 rounded-2xl bg-gradient-to-tr from-amber-500/35 via-blue-600/30 to-emerald-500/35 blur-md pointer-events-none transform scale-95"
          style={{ filter: 'blur(10px)' }}
        />
      )}

      {/* Official 3D Jhalak Tiranga App Logo Badge */}
      <img
        src="/logo.png"
        alt="Jhalak Reels: Made in India"
        className="relative z-10 w-full h-full object-contain filter drop-shadow-md rounded-[22%]"
        draggable={false}
        onError={(e) => {
          // Fallback to assets copy or SVG if needed
          e.currentTarget.src = '/assets/jhalak-tiranga-logo.png';
        }}
      />
    </div>
  );
};
