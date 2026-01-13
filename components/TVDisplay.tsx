import React from 'react';

interface TVDisplayProps {
  readonly loketNumber: number;
  readonly code: string;
  readonly rightTrapezoidColor?: string;
}

export default function TVDisplay({ loketNumber, code, rightTrapezoidColor = '#00FF00' }: TVDisplayProps) {
  return (
    <div className="relative w-full" style={{ aspectRatio: '189/111' }}>
      {/* Trapezoid top frame with LOKET text */}
      <div className="absolute top-0 left-0 right-0" style={{ height: '24.32%' }}>
        <svg
          className="w-full h-full"
          viewBox="0 0 189 27"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          {/* Left trapezoid - Blue */}
          <path
            d="M164.866 12.6709L148.214 27H0V0H150.14L164.866 12.6709Z"
            fill="#044EEB"
          />
          {/* Right trapezoid - Custom color */}
          <path
            d="M188.866 12.6709L172.214 27H156L172.652 12.6709L157.927 0H174.14L188.866 12.6709Z"
            fill={rightTrapezoidColor}
          />
          {/* LOKET text inside trapezoid */}
          <text
            x="70"
            y="19"
            fill="white"
            fontSize="19"
            fontWeight="500"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            letterSpacing="0.8px"
          >
            Loket {loketNumber}
          </text>
        </svg>
      </div>

      {/* Main blue rectangle */}
      <div 
        className="absolute left-0 right-0 bg-[#044EEB] flex items-center justify-center"
        style={{ top: '29.73%', bottom: 0 }}
      >
        <span 
          className="text-white font-bold tracking-tight"
          style={{ 
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontFamily: 'Arial, sans-serif'
          }}
        >
          {code}
        </span>
      </div>
    </div>
  );
}

