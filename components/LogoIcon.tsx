import React from 'react';

const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 52 48"
    fill="url(#logo-gradient-component)"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="logo-gradient-component" x1="0" y1="0" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
    </defs>
    <rect x="2" y="14" width="4" height="20" rx="2" />
    <rect x="8" y="22" width="4" height="12" rx="2" />
    <rect x="14" y="30" width="4" height="4" rx="2" />
    <rect x="20" y="22" width="4" height="12" rx="2" />
    <rect x="26" y="14" width="4" height="20" rx="2" />
    <rect x="34" y="14" width="4" height="20" rx="2" />
    <rect x="40" y="14" width="4" height="6" rx="2" />
    <rect x="46" y="14" width="4" height="6" rx="2" />
    <rect x="40" y="24" width="4" height="6" rx="2" />
    <rect x="46" y="24" width="4" height="6" rx="2" />
  </svg>
);

export default LogoIcon;
