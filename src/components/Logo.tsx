/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * مكوّن الشعار الرسمي لنظام "ذا ستار شاليه"
 * يتضمن هلال ذهبي + نجمة + شاليه بتصميم SVG مضغوط
 */
export const Logo: React.FC<LogoProps> = ({ size = 40, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="شعار ذا ستار شاليه"
    >
      <defs>
        <linearGradient id="logo-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8C97A" />
          <stop offset="50%" stopColor="#D4A853" />
          <stop offset="100%" stopColor="#B8902F" />
        </linearGradient>
        <linearGradient id="logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#131d36" />
          <stop offset="100%" stopColor="#0c1222" />
        </linearGradient>
        <filter id="logo-glow">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* خلفية الأيقونة */}
      <rect width="512" height="512" rx="112" fill="url(#logo-bg)" />
      <rect x="4" y="4" width="504" height="504" rx="108" fill="none" stroke="url(#logo-gold)" strokeWidth="4" strokeOpacity="0.4"/>

      {/* الهلال الذهبي */}
      <path
        d="M160 100 C 100 140, 80 240, 140 320 C 170 360, 200 360, 200 360 C 150 340, 120 280, 120 220 C 120 160, 140 120, 160 100 Z"
        fill="url(#logo-gold)"
        filter="url(#logo-glow)"
        opacity="0.95"
      />

      {/* النجمة */}
      <polygon
        points="310,95 325,145 378,145 335,178 350,228 310,198 270,228 285,178 242,145 295,145"
        fill="url(#logo-gold)"
        filter="url(#logo-glow)"
      />

      {/* سقف الشاليه */}
      <path
        d="M145 310 L256 230 L367 310"
        fill="none"
        stroke="url(#logo-gold)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* جسم الشاليه */}
      <rect
        x="170" y="310" width="172" height="100" rx="4"
        fill="none"
        stroke="url(#logo-gold)"
        strokeWidth="8"
      />

      {/* الباب */}
      <path
        d="M235 410 L235 345 Q256 330 277 345 L277 410"
        fill="none"
        stroke="url(#logo-gold)"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* النوافذ */}
      <rect x="185" y="330" width="28" height="28" rx="4"
        fill="none" stroke="url(#logo-gold)" strokeWidth="5" opacity="0.8"/>
      <rect x="299" y="330" width="28" height="28" rx="4"
        fill="none" stroke="url(#logo-gold)" strokeWidth="5" opacity="0.8"/>

      {/* نقاط زخرفية على السقف */}
      <circle cx="210" cy="290" r="3" fill="url(#logo-gold)" opacity="0.6"/>
      <circle cx="256" cy="265" r="3" fill="url(#logo-gold)" opacity="0.6"/>
      <circle cx="302" cy="290" r="3" fill="url(#logo-gold)" opacity="0.6"/>
    </svg>
  );
};

/**
 * شعار مصغّر للفافيكون والأماكن الضيقة
 */
export const LogoMini: React.FC<LogoProps> = ({ size = 24, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="شعار ذا ستار شاليه"
    >
      <defs>
        <linearGradient id="mini-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8C97A" />
          <stop offset="100%" stopColor="#D4A853" />
        </linearGradient>
      </defs>
      {/* نجمة مبسطة */}
      <polygon
        points="32,6 38,22 55,22 41,32 46,48 32,39 18,48 23,32 9,22 26,22"
        fill="url(#mini-gold)"
      />
      {/* سقف شاليه مبسط */}
      <path d="M14 50 L32 38 L50 50" fill="none" stroke="url(#mini-gold)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      {/* قاعدة */}
      <line x1="18" y1="50" x2="46" y2="50" stroke="url(#mini-gold)" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
};
