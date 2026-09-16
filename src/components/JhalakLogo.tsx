import React, { useId } from 'react';

interface JhalakLogoProps {
  size?: number;
  className?: string;
  showGlow?: boolean;
  animate?: boolean;
}

/**
 * Jhalak Official Brand Logo
 * Pixel-accurate, high-definition 3D badge matching the official uploaded brand asset:
 * - Royal Blue multi-layered beveled squircle frame with inner neon blue ridge
 * - 3D Volumetric Indian Tiranga (Saffron, White, Emerald Green) ribbon 'J' loop
 * - Tilted filmstrip clapper with sprocket holes and white play button
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
  const rawId = useId();
  // Sanitize ID for safe use in SVG URL fragment identifiers
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');

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

      {/* High-Fidelity Vector App Badge */}
      <svg
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full h-full object-contain filter drop-shadow-sm"
        aria-label="Jhalak Reels: Made in India"
        role="img"
      >
        <defs>
          {/* Background Royal Blue Depth */}
          <linearGradient id={`${uid}-bg-royal`} x1="60" y1="20" x2="450" y2="490" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E52B5" />
            <stop offset="25%" stopColor="#0F3A8E" />
            <stop offset="65%" stopColor="#09276E" />
            <stop offset="100%" stopColor="#030F2C" />
          </linearGradient>

          {/* Outer Squircle Rim Bevel */}
          <linearGradient id={`${uid}-rim-bevel`} x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#5CA0F8" />
            <stop offset="35%" stopColor="#256BF5" />
            <stop offset="70%" stopColor="#0E338A" />
            <stop offset="100%" stopColor="#05143A" />
          </linearGradient>

          {/* Groove Shadow Gradient */}
          <linearGradient id={`${uid}-groove`} x1="30" y1="30" x2="480" y2="480" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#081E54" />
            <stop offset="100%" stopColor="#02091A" />
          </linearGradient>

          {/* Inner Blue Glow Border */}
          <linearGradient id={`${uid}-inner-border`} x1="50" y1="50" x2="460" y2="460" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="50%" stopColor="#2563EB" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          {/* Tiranga Saffron Gradient */}
          <linearGradient id={`${uid}-saffron`} x1="180" y1="90" x2="380" y2="280" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFA000" />
            <stop offset="30%" stopColor="#FF7700" />
            <stop offset="65%" stopColor="#FF5722" />
            <stop offset="100%" stopColor="#E64A19" />
          </linearGradient>

          {/* Saffron Top Shine */}
          <linearGradient id={`${uid}-saffron-shine`} x1="210" y1="90" x2="330" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFE082" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#FFB74D" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FF9800" stopOpacity="0" />
          </linearGradient>

          {/* Tiranga White Gradient */}
          <linearGradient id={`${uid}-white`} x1="200" y1="180" x2="370" y2="340" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#F8FAFC" />
            <stop offset="70%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          {/* Tiranga Green Gradient */}
          <linearGradient id={`${uid}-green`} x1="190" y1="260" x2="380" y2="430" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00E676" />
            <stop offset="35%" stopColor="#00C853" />
            <stop offset="70%" stopColor="#009639" />
            <stop offset="100%" stopColor="#005826" />
          </linearGradient>

          {/* Green Shine */}
          <linearGradient id={`${uid}-green-shine`} x1="210" y1="320" x2="310" y2="390" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#B9F6CA" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#69F0AE" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00E676" stopOpacity="0" />
          </linearGradient>

          {/* Golden Metallic Text Gradient */}
          <linearGradient id={`${uid}-gold-text`} x1="160" y1="410" x2="352" y2="445" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF8D6" />
            <stop offset="25%" stopColor="#FDE68A" />
            <stop offset="55%" stopColor="#F59E0B" />
            <stop offset="85%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>

          {/* Drop Shadows & Glow Filters */}
          <filter id={`${uid}-badge-shadow`} x="-10%" y="-10%" width="125%" height="125%">
            <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#000000" floodOpacity="0.5" />
          </filter>

          <filter id={`${uid}-ribbon-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#01081C" floodOpacity="0.7" />
          </filter>

          <filter id={`${uid}-gold-glow`} x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#FFB300" floodOpacity="0.6" />
          </filter>

          <filter id={`${uid}-sparkle-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Outer App Icon Squircle Container with Soft Ambient Shadow */}
        <rect
          x="22"
          y="22"
          width="468"
          height="468"
          rx="100"
          fill={`url(#${uid}-bg-royal)`}
          filter={`url(#${uid}-badge-shadow)`}
        />

        {/* Outer Beveled 3D Border Rim */}
        <rect
          x="22"
          y="22"
          width="468"
          height="468"
          rx="100"
          stroke={`url(#${uid}-rim-bevel)`}
          strokeWidth="12"
          fill="none"
        />

        {/* Recessed Dark Groove */}
        <rect
          x="33"
          y="33"
          width="446"
          height="446"
          rx="90"
          stroke={`url(#${uid}-groove)`}
          strokeWidth="6"
          fill="none"
        />

        {/* Inner Vibrant Blue Glow Border Line */}
        <rect
          x="42"
          y="42"
          width="428"
          height="428"
          rx="82"
          stroke={`url(#${uid}-inner-border)`}
          strokeWidth="3.5"
          fill="none"
        />

        {/* 2. Sparkles & Ambient Bokeh Glows */}
        <g fill="#FFD54F" filter={`url(#${uid}-sparkle-glow)`}>
          {/* 4-point Diamond Star: Top Right */}
          <path
            d="M365 110 Q365 120 371 125 Q377 130 387 130 Q377 130 371 135 Q365 140 365 150 Q365 140 359 135 Q353 130 343 130 Q353 130 359 125 Q365 120 365 110 Z"
            fill="#FFE082"
          />
          <circle cx="365" cy="130" r="2.5" fill="#FFFFFF" />

          {/* 4-point Diamond Star: Top Left */}
          <path
            d="M165 142 Q165 149 169 153 Q173 157 180 157 Q173 157 169 161 Q165 165 165 172 Q165 165 161 161 Q157 157 150 157 Q157 157 161 153 Q165 149 165 142 Z"
            fill="#FFE082"
          />
          <circle cx="165" cy="157" r="2" fill="#FFFFFF" />

          {/* 4-point Diamond Star: Bottom Left */}
          <path
            d="M128 275 Q128 281 132 284 Q136 287 142 287 Q136 287 132 290 Q128 293 128 299 Q128 293 124 290 Q120 287 114 287 Q120 287 124 284 Q128 281 128 275 Z"
            fill="#FFD54F"
          />

          {/* 4-point Diamond Star: Bottom Right */}
          <path
            d="M385 272 Q385 277 388 280 Q391 283 396 283 Q391 283 388 286 Q385 289 385 294 Q385 289 382 286 Q379 283 374 283 Q379 283 382 280 Q385 277 385 272 Z"
            fill="#FFD54F"
          />

          {/* Glowing Dust Particles (Bokeh) */}
          <circle cx="198" cy="108" r="2.5" fill="#FFE082" opacity="0.85" />
          <circle cx="120" cy="190" r="3" fill="#FFE082" opacity="0.8" />
          <circle cx="395" cy="200" r="2.5" fill="#FFFFFF" opacity="0.9" />
          <circle cx="140" cy="330" r="2" fill="#FFE082" opacity="0.85" />
          <circle cx="365" cy="325" r="2.5" fill="#FFE082" opacity="0.85" />
          <circle cx="215" cy="370" r="2" fill="#FFFFFF" opacity="0.8" />
          <circle cx="300" cy="100" r="2" fill="#FFE082" opacity="0.75" />
        </g>

        {/* 3. Festive Silhouetted Indian Dancers */}
        {/* Dancer 1: Emerald Green Classical Dancer (Top Left Upper) */}
        <g fill="#00E676" opacity="0.92">
          <circle cx="178" cy="114" r="5.5" />
          <path d="M175 120 C171 122 166 118 166 115 C166 111 171 113 175 117 Z" />
          <path d="M181 120 C186 121 190 117 189 114 C188 111 184 113 181 117 Z" />
          <path d="M175 121 L181 121 L188 138 C182 141 173 141 170 138 Z" />
          <path d="M174 139 L172 146 M182 139 L183 146" stroke="#00E676" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Dancer 2: Saffron Orange Swirling Ghagra Folk Dancer (Top Left) */}
        <g fill="#FF8F00" opacity="0.95">
          <circle cx="138" cy="124" r="7" />
          {/* Graceful curved arms overhead in Garba/Ghoomar mudra */}
          <path d="M134 132 C130 135 122 137 120 134 C117 131 119 126 124 125 C128 124 132 129 135 132 Z" />
          <path d="M142 132 C145 134 152 133 154 129 C156 125 151 122 147 124 C143 126 142 130 142 132 Z" />
          {/* Flared swirling ghagra dress */}
          <path d="M134 134 L142 134 L150 154 C145 158 131 159 126 154 Z" />
          <path d="M133 156 L130 165 M142 156 L144 165" stroke="#FF8F00" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Dancer 3: Saffron-Red Leaping Folk Dancer (Top Right) */}
        <g fill="#FF7043" opacity="0.95">
          <circle cx="386" cy="128" r="6.8" />
          {/* Energetic leaping pose with one hand high */}
          <path d="M382 135 C377 132 371 133 369 137 C367 141 372 144 376 140 C380 137 382 136 382 135 Z" />
          <path d="M390 135 C395 132 401 134 402 139 C403 143 397 145 394 141 C391 138 390 136 390 135 Z" />
          {/* Leaping body and legs */}
          <path d="M383 136 L389 136 L392 153 L380 153 Z" />
          <path d="M381 153 L376 163 M391 153 L398 161" stroke="#FF7043" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Dancer 4: Golden Bhangra Celebration Dancer (Left Middle) */}
        <g fill="#FFCA28" opacity="0.95">
          <circle cx="126" cy="180" r="7" />
          {/* Joyous Bhangra raised arms */}
          <path d="M123 188 C118 185 112 178 114 174 C116 170 122 173 122 179 C122 183 123 187 123 188 Z" />
          <path d="M129 188 C134 184 141 179 140 175 C139 171 133 173 132 179 C131 183 129 187 129 188 Z" />
          <path d="M123 189 L129 189 L132 206 L120 206 Z" />
          <path d="M121 207 L116 216 M130 207 L133 216" stroke="#FFCA28" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Dancer 5: Emerald Green Folk Dancer (Bottom Right) */}
        <g fill="#00E676" opacity="0.92">
          <circle cx="355" cy="326" r="6" />
          <path d="M352 333 C348 335 344 332 344 329 C344 326 348 327 352 330 Z" />
          <path d="M358 333 C362 334 366 331 365 328 C364 326 361 327 358 330 Z" />
          <path d="M352 334 L358 334 L363 349 C358 352 350 352 347 349 Z" />
          <path d="M351 350 L349 357 M358 350 L360 357" stroke="#00E676" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Musical Notes (Joyful Rhythm) */}
        {/* Red-orange double-eighth note (Top Right) */}
        <g stroke="#FF7043" strokeWidth="2.5" strokeLinecap="round" fill="#FF7043">
          <path d="M394 178 L394 164 L408 160 L408 174 M394 169 L408 165" />
          <ellipse cx="389" cy="179" rx="4.8" ry="3.4" transform="rotate(-15 389 179)" />
          <ellipse cx="403" cy="175" rx="4.8" ry="3.4" transform="rotate(-15 403 175)" />
        </g>

        {/* Golden musical note (Left) */}
        <g stroke="#FFCA28" strokeWidth="2.5" strokeLinecap="round" fill="#FFCA28">
          <path d="M160 176 L160 162 L174 158 L174 172 M160 167 L174 163" />
          <ellipse cx="155" cy="177" rx="4.8" ry="3.4" transform="rotate(-15 155 177)" />
          <ellipse cx="169" cy="173" rx="4.8" ry="3.4" transform="rotate(-15 169 173)" />
        </g>

        {/* Golden single note (Bottom Right) */}
        <g stroke="#FFCA28" strokeWidth="2.2" strokeLinecap="round" fill="#FFCA28">
          <path d="M380 322 L380 310 L388 308" />
          <ellipse cx="375" cy="323" rx="4.5" ry="3.2" transform="rotate(-15 375 323)" />
        </g>

        {/* 4. ICONIC 3D VOLUMETRIC TIRANGA RIBBON 'J' LOOP */}
        <g filter={`url(#${uid}-ribbon-shadow)`}>
          {/* Back Shading / Shadow Core behind inner loop */}
          <path
            d="M285 105 C315 105 342 125 342 156 C342 188 322 216 295 235 C282 244 268 253 256 264 C236 282 222 302 222 328 C222 368 252 396 292 396 C332 396 364 365 372 322 C376 300 376 270 372 245 C374 246 378 249 382 255 C384 278 384 306 380 330 C370 380 332 414 286 414 C234 414 198 376 198 328 C198 292 216 266 240 244 C256 230 274 218 290 206 C314 188 326 168 326 148 C326 132 312 118 290 118 C266 118 242 134 232 152 L215 138 C230 116 258 105 285 105 Z"
            fill="#051538"
            opacity="0.55"
          />

          {/* EMERALD GREEN STRIPE & DRAMATIC RISING WING/TAIL */}
          <path
            d="M216 285 C232 268 248 254 264 242 C252 262 244 286 244 314 C244 354 268 376 300 376 C332 376 360 348 368 308 C374 278 372 248 366 226 C374 236 380 252 382 272 C384 298 378 334 364 366 C348 402 318 424 280 424 C232 424 196 388 196 336 C196 306 206 286 216 285 Z"
            fill={`url(#${uid}-green)`}
          />
          {/* Specular highlight on green curve */}
          <path
            d="M224 330 C224 374 252 406 292 406 C334 406 368 372 378 326 C370 358 342 388 308 388 C276 388 252 364 252 330 C252 308 258 290 266 276 C252 290 242 308 236 324 Z"
            fill={`url(#${uid}-green-shine)`}
          />

          {/* PURE WHITE STRIPE (Core dynamic spine & inner ribbon) */}
          <path
            d="M246 172 C258 152 276 138 296 138 C318 138 330 152 330 168 C330 188 316 210 292 230 C274 245 254 260 238 276 C224 292 214 310 214 334 C214 366 236 394 270 402 C252 396 236 376 236 348 C236 324 246 304 260 288 C278 270 298 254 316 238 C340 218 356 192 356 166 C356 136 332 118 300 118 C274 118 252 134 238 156 L246 172 Z"
            fill={`url(#${uid}-white)`}
          />

          {/* VIBRANT SAFFRON ORANGE STRIPE (Upper Hook, Outer Twist & Crown Loop) */}
          <path
            d="M220 206 C216 194 218 178 226 162 C238 138 262 120 292 120 C322 120 344 138 344 164 C344 192 326 218 302 238 C284 252 266 266 250 282 C236 298 228 316 228 336 C228 368 250 392 284 398 C264 390 248 370 248 344 C248 322 256 304 270 288 C286 270 306 254 322 238 C346 216 362 188 362 158 C362 124 334 102 298 102 C262 102 234 124 220 152 C210 170 208 190 216 208 L220 206 Z"
            fill={`url(#${uid}-saffron)`}
          />

          {/* Top Saffron Gloss Shine Arc */}
          <path
            d="M298 108 C328 108 350 126 350 154 C350 178 338 202 318 220 C302 234 286 248 272 262 C262 272 256 280 250 290 C254 278 262 268 274 256 C290 240 308 224 324 206 C340 188 350 168 350 148 C350 126 332 110 306 110 C280 110 256 126 244 148 C238 160 236 172 238 184 C234 174 234 162 240 150 C252 126 274 108 298 108 Z"
            fill={`url(#${uid}-saffron-shine)`}
          />
          <path
            d="M296 104 C318 104 338 116 344 134 C338 122 320 112 300 112 C276 112 254 124 242 142 C252 120 272 104 296 104 Z"
            fill="#FFE082"
            opacity="0.9"
          />
        </g>

        {/* 5. FILMSTRIP SLATE & PLAY BADGE (Nestled inside lower loop) */}
        <g transform="translate(230, 276) rotate(-10 28 22)">
          {/* Slate Base Box with Royal Blue Tint & Gloss Glow */}
          <rect
            x="0"
            y="0"
            width="56"
            height="42"
            rx="7"
            fill="#0B2562"
            stroke="#3B82F6"
            strokeWidth="2.5"
            filter={`url(#${uid}-gold-glow)`}
          />

          {/* Top Sprocket Holes (4 Rectangles) */}
          <rect x="5.5" y="4.5" width="7.5" height="5.5" rx="1.2" fill="#FFFFFF" opacity="0.95" />
          <rect x="17.5" y="4.5" width="7.5" height="5.5" rx="1.2" fill="#FFFFFF" opacity="0.95" />
          <rect x="29.5" y="4.5" width="7.5" height="5.5" rx="1.2" fill="#FFFFFF" opacity="0.95" />
          <rect x="41.5" y="4.5" width="7.5" height="5.5" rx="1.2" fill="#FFFFFF" opacity="0.95" />

          {/* Bottom Sprocket Holes (4 Rectangles) */}
          <rect x="5.5" y="32" width="7.5" height="5.5" rx="1.2" fill="#FFFFFF" opacity="0.95" />
          <rect x="17.5" y="32" width="7.5" height="5.5" rx="1.2" fill="#FFFFFF" opacity="0.95" />
          <rect x="29.5" y="32" width="7.5" height="5.5" rx="1.2" fill="#FFFFFF" opacity="0.95" />
          <rect x="41.5" y="32" width="7.5" height="5.5" rx="1.2" fill="#FFFFFF" opacity="0.95" />

          {/* Central White Play Triangle */}
          <polygon points="23,14 23,28 35,21" fill="#FFFFFF" />
        </g>

        {/* 6. METALLIC GOLD EMBOSSED BRAND TYPOGRAPHY */}
        <g textAnchor="middle">
          {/* JHALAK in Bold Metallic Golden Typography with 3D Drop Shadow */}
          <text
            x="256"
            y="428"
            fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
            fontSize="36"
            fontWeight="900"
            letterSpacing="4.5"
            fill="#020817"
            opacity="0.7"
          >
            JHALAK
          </text>
          <text
            x="256"
            y="426"
            fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
            fontSize="36"
            fontWeight="900"
            letterSpacing="4.5"
            fill={`url(#${uid}-gold-text)`}
            filter={`url(#${uid}-gold-glow)`}
          >
            JHALAK
          </text>

          {/* Reels: Made in India in Crisp White Sans-Serif Font */}
          <text
            x="256"
            y="456"
            fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
            fontSize="14.5"
            fontWeight="700"
            letterSpacing="1.4"
            fill="#FFFFFF"
            opacity="0.98"
          >
            Reels: Made in India
          </text>
        </g>
      </svg>
    </div>
  );
};
