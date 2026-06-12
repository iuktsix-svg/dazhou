/* ============================================================
   大周日暮录 — Icon System
   ============================================================ */

import React from 'react';
import * as Lucide from 'lucide-react';

// ---- SVG Props ----
type CustomIconProps = {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};

// ---- Custom Chinese-style SVGs ----

export const SwordIcon: React.FC<CustomIconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M18 2L22 6L7 21H3V17L18 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M14 6L18 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M3 21V18L18 3L22 7L7 22H4V21Z" stroke="currentColor" strokeWidth="0.5" strokeLinejoin="round"/>
    <circle cx="18" cy="6" r="1.5" fill="currentColor" opacity="0.5"/>
  </svg>
);

export const FanIcon: React.FC<CustomIconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 3V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 12C6 8 4 6 4 6C4 6 8 14 12 12Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1"/>
    <path d="M12 12C18 8 20 6 20 6C20 6 16 14 12 12Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1"/>
    <path d="M12 12V3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

export const ScrollIcon: React.FC<CustomIconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M5 2H19V22H5C3.89543 22 3 21.1046 3 20V4C3 2.89543 3.89543 2 5 2Z" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="7.5" cy="5.5" r="0.8" fill="currentColor"/>
    <rect x="9" y="5" width="8" height="1" rx="0.5" fill="currentColor" opacity="0.6"/>
    <circle cx="7.5" cy="9.5" r="0.8" fill="currentColor"/>
    <rect x="9" y="9" width="6" height="1" rx="0.5" fill="currentColor" opacity="0.6"/>
    <circle cx="7.5" cy="13.5" r="0.8" fill="currentColor"/>
    <rect x="9" y="13" width="7" height="1" rx="0.5" fill="currentColor" opacity="0.6"/>
    <path d="M5 19C5 18.4477 5.44772 18 6 18H19" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

export const SealIcon: React.FC<CustomIconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="6.5" y="6.5" width="11" height="11" rx="1" stroke="currentColor" strokeWidth="0.8"/>
    <text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="currentColor" fontFamily="serif">印</text>
  </svg>
);

export const LanternIcon: React.FC<CustomIconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <ellipse cx="12" cy="13" rx="5" ry="7" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="10.5" y="5" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1"/>
    <rect x="9" y="20" width="6" height="1.5" rx="0.5" stroke="currentColor" strokeWidth="0.8"/>
    <line x1="12" y1="8" x2="12" y2="10" stroke="currentColor" strokeWidth="1"/>
  </svg>
);

export const BambooIcon: React.FC<CustomIconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="2" width="1.5" height="20" rx="0.75" fill="currentColor" opacity="0.6"/>
    <line x1="6" y1="4" x2="10" y2="4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    <line x1="6" y1="12" x2="11" y2="12" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    <line x1="6" y1="20" x2="9" y2="20" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    <rect x="11" y="2.5" width="1.5" height="19" rx="0.75" fill="currentColor" opacity="0.5"/>
    <line x1="14" y1="4" x2="20" y2="4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    <line x1="14" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    <line x1="14" y1="14" x2="19" y2="14" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    <line x1="14" y1="19" x2="20" y2="19" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

export const CloudIcon: React.FC<CustomIconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M6 16C3.79086 16 2 14.2091 2 12C2 9.79086 3.79086 8 6 8C6 5.5 8 3.5 10.5 3.5C12.5 3.5 14.5 5 15 7C17.5 7.5 19.5 9.5 19.5 12C19.5 14.5 17.5 16.5 15 16.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M6 13C5 13 4 14 4 15.5C4 17 5 18 6 18H15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const MountainIcon: React.FC<CustomIconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M1 22L9 8L12 14L16 5L23 22" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M9 8L12 14L16 5L23 22" stroke="currentColor" strokeWidth="0.5" fill="currentColor" fillOpacity="0.15"/>
  </svg>
);

export const CraneIcon: React.FC<CustomIconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 3C12 3 8 7 8 11C8 14 10 16 12 17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M12 17C14 16 16 14 16 11C16 7 12 3 12 3" stroke="currentColor" strokeWidth="0.7"/>
    <path d="M10 22C10 20 13 17 18 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="18" cy="9" r="1.2" stroke="currentColor" strokeWidth="1"/>
  </svg>
);

export const PlumIcon: React.FC<CustomIconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.6"/>
    {[0, 72, 144, 216, 288].map(deg => (
      <line key={deg} x1="12" y1="9" x2="12" y2="8" stroke="currentColor" strokeWidth="1" strokeLinecap="round"
        transform={`rotate(${deg} 12 12)`}/>
    ))}
  </svg>
);

export const CenserIcon: React.FC<CustomIconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M10 4H14V6L12 7L10 6V4Z" stroke="currentColor" strokeWidth="1.2"/>
    <ellipse cx="12" cy="11" rx="4" ry="5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M8 14L6 20L12 18L18 20L16 14" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
    <path d="M10 4L9 2L15 2L14 4" stroke="currentColor" strokeWidth="0.8"/>
    {/* Smoke wisps */}
    <path d="M10 2.5C9.5 1 10.5 0 12 0.5" stroke="currentColor" strokeWidth="0.6" opacity="0.4"/>
    <path d="M11 1.5C11 0 12.5 -0.5 13 0.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
  </svg>
);

export const SlipIcon: React.FC<CustomIconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="2" width="5" height="20" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="8.5" y="2" width="5" height="20" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="14" y="2" width="5" height="20" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <line x1="3" y1="7" x2="8" y2="7" stroke="currentColor" strokeWidth="0.6" opacity="0.4"/>
    <line x1="8.5" y1="7" x2="13.5" y2="7" stroke="currentColor" strokeWidth="0.6" opacity="0.4"/>
    <line x1="14" y1="7" x2="19" y2="7" stroke="currentColor" strokeWidth="0.6" opacity="0.4"/>
  </svg>
);

export const TokenIcon: React.FC<CustomIconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.3"/>
    <text x="12" y="16.5" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor" fontFamily="serif">令</text>
  </svg>
);

export const ZitherIcon: React.FC<CustomIconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="8" width="18" height="8" rx="2" stroke="currentColor" strokeWidth="1.2"/>
    <line x1="6" y1="8" x2="6" y2="16" stroke="currentColor" strokeWidth="0.6" opacity="0.5"/>
    <line x1="18" y1="8" x2="18" y2="16" stroke="currentColor" strokeWidth="0.6" opacity="0.5"/>
    {[9, 12, 15].map(x => (
      <line key={x} x1={x} y1="8.5" x2={x} y2="15.5" stroke="currentColor" strokeWidth="0.4" opacity="0.3"/>
    ))}
  </svg>
);

export const ChessIcon: React.FC<CustomIconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>
    <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>
    <circle cx="12" cy="7.5" r="1.8" fill="currentColor" opacity="0.7"/>
    <circle cx="7" cy="16" r="1.8" fill="currentColor" opacity="0.3"/>
  </svg>
);

export const WineIcon: React.FC<CustomIconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M8 2H16L15 9H9L8 2Z" stroke="currentColor" strokeWidth="1.2"/>
    <ellipse cx="12" cy="15" rx="4" ry="5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M8 18H16" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
  </svg>
);

export const TeaIcon: React.FC<CustomIconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M5 7H15C16.1046 7 17 7.89543 17 9V11C17 12.1046 16.1046 13 15 13H13" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M13 13H5L4 19H14L13 13Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    <path d="M17 9H18C19.1046 9 20 9.89543 20 11V12" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    <ellipse cx="4" cy="7" rx="2" ry="1.5" stroke="currentColor" strokeWidth="1" fill="currentColor" fillOpacity="0.15"/>
  </svg>
);

// ---- Icon name -> component map ----
export const customIcons = {
  sword: SwordIcon,
  fan: FanIcon,
  scroll: ScrollIcon,
  seal: SealIcon,
  lantern: LanternIcon,
  bamboo: BambooIcon,
  cloud: CloudIcon,
  mountain: MountainIcon,
  crane: CraneIcon,
  plum: PlumIcon,
  censer: CenserIcon,
  slip: SlipIcon,
  token: TokenIcon,
  zither: ZitherIcon,
  chess: ChessIcon,
  wine: WineIcon,
  tea: TeaIcon,
} as const;

export type CustomIconName = keyof typeof customIcons;

// ---- Unified Icon component ----
interface IconProps {
  name: Lucide.LucideIcon | CustomIconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export const Icon: React.FC<IconProps> = ({ name, size = 18, className, strokeWidth }) => {
  // Custom icons
  if (typeof name === 'string' && name in customIcons) {
    const CustomComp = customIcons[name as CustomIconName];
    return <CustomComp size={size} className={className} />;
  }
  // Lucide icons
  const LucideComp = name as Lucide.LucideIcon;
  return <LucideComp size={size} className={className} strokeWidth={strokeWidth ?? 1.5} />;
};

// Re-export commonly used Lucide icons with semantic names
export {
  Lucide,
};
