import React from 'react';

const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="logo-gradient-component" x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="50%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
      <linearGradient id="logo-wave-gradient-component" x1="14" y1="24" x2="50" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#a5f3fc" />
        <stop offset="100%" stopColor="#fbcfe8" />
      </linearGradient>
    </defs>
    <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#logo-gradient-component)" />
    <rect x="8.5" y="8.5" width="47" height="47" rx="14" fill="rgba(15, 23, 42, 0.18)" stroke="rgba(255, 255, 255, 0.35)" />
    <path
      d="M14 40H20V30H24V40H29V24H33V40H38V32H42V40H50"
      stroke="url(#logo-wave-gradient-component)"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="14" cy="40" r="2.4" fill="#a5f3fc" />
    <circle cx="50" cy="40" r="2.4" fill="#fbcfe8" />
    <path d="M14 20H26" stroke="rgba(255, 255, 255, 0.72)" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export default LogoIcon;
