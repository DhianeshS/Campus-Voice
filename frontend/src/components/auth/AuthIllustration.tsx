export function AuthIllustration({ className = '' }: { className?: string }) {
  return (
    <div className={`relative w-full max-w-sm mx-auto flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 400 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-subtle"
        aria-hidden="true"
      >
        {/* Soft Background Geometry */}
        <circle cx="200" cy="180" r="140" fill="#E6EDE5" fillOpacity="0.5" />
        <path
          d="M100 280 C100 170, 300 170, 300 280"
          stroke="#A7B8A5"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Minimalist Campus Architectural Arch */}
        <path
          d="M140 290 V170 C140 136.86 166.86 110 200 110 C233.14 110 260 136.86 260 170 V290"
          stroke="#365442"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M160 290 V175 C160 152.9 177.9 135 200 135 C222.1 135 240 152.9 240 175 V290"
          stroke="#496B58"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Inner Window Keystone & Ground Horizon */}
        <line x1="80" y1="290" x2="320" y2="290" stroke="#365442" strokeWidth="2" strokeLinecap="round" />
        <line x1="60" y1="298" x2="340" y2="298" stroke="#E5E0D5" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M195 110 H205 V122 H195 Z" fill="#365442" />

        {/* Abstract Soundwave / Voice Pulse Lines in Gateway */}
        <line x1="185" y1="230" x2="185" y2="250" stroke="#496B58" strokeWidth="2" strokeLinecap="round" />
        <line x1="195" y1="215" x2="195" y2="265" stroke="#365442" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="205" y1="205" x2="205" y2="275" stroke="#496B58" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="215" y1="220" x2="215" y2="260" stroke="#496B58" strokeWidth="2" strokeLinecap="round" />

        {/* Minimal Botanical Sage Sprig (Left) */}
        <path
          d="M110 290 Q120 220 150 180 Q160 165 175 160"
          stroke="#496B58"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Botanical Leaves Left */}
        <path d="M130 250 C120 240 120 230 135 235 C145 238 140 250 130 250 Z" fill="#A7B8A5" />
        <path d="M142 220 C155 210 160 215 150 225 C142 232 136 226 142 220 Z" fill="#496B58" fillOpacity="0.8" />
        <path d="M152 190 C140 182 142 172 155 178 C163 182 160 192 152 190 Z" fill="#365442" />

        {/* Minimal Botanical Sage Sprig (Right) */}
        <path
          d="M290 290 Q275 230 248 190 Q240 178 228 172"
          stroke="#496B58"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Botanical Leaves Right */}
        <path d="M270 255 C282 248 280 236 268 242 C258 246 262 258 270 255 Z" fill="#A7B8A5" />
        <path d="M255 225 C242 215 240 225 248 232 C255 238 262 232 255 225 Z" fill="#496B58" fillOpacity="0.8" />
        <path d="M245 195 C256 186 255 176 244 182 C236 186 238 196 245 195 Z" fill="#365442" />

        {/* Subtle Terracotta Decorative Sun Accent */}
        <circle cx="285" cy="115" r="7" fill="#B8755D" fillOpacity="0.85" />
        <circle cx="285" cy="115" r="14" stroke="#B8755D" strokeWidth="1" strokeDasharray="2 3" strokeOpacity="0.4" />
      </svg>
    </div>
  );
}
