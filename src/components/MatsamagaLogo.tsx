import React from 'react';

interface MatsamagaLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const MatsamagaLogo: React.FC<MatsamagaLogoProps> = ({
  className = 'w-10 h-10',
  size,
  showText = false
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/assets/logo-matsamaga.svg"
        alt="Logo Resmi MTsN 5 Tegal - Matsamaga"
        width={size}
        height={size}
        className="w-full h-full object-contain shrink-0 drop-shadow-xs"
        onError={(e) => {
          // Fallback if image fails
          const target = e.currentTarget;
          target.style.display = 'none';
        }}
      />
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-white drop-shadow-xs">
            KUIS CERDAS MATSAMAGA
          </span>
          <span className="text-[11px] font-semibold text-emerald-200 tracking-wider uppercase">
            MTs Negeri 5 Tegal
          </span>
        </div>
      )}
    </div>
  );
};
