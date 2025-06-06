import React from 'react';

interface DivineEyeIconProps {
  className?: string;
}

const DivineEyeIcon: React.FC<DivineEyeIconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    {/* Sclera (main eye shape) */}
    <path d="M12 17.5c-4.25 0-7.96-2.25-9.75-5.62a.75.75 0 010-.76C4.04 7.75 7.75 5.5 12 5.5s7.96 2.25 9.75 5.62a.75.75 0 010 .76C19.96 15.25 16.25 17.5 12 17.5z" fillOpacity="0.8"/>
    {/* Iris */}
    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
    {/* Pupil (smaller circle inside Iris) */}
    <path d="M12 13.25a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z" />
    {/* Sparkle 1 (top-right) - 4 pointed star */}
    <path d="M18.5 5.5 L19.207 7.793 L21.5 8.5 L19.207 9.207 L18.5 11.5 L17.793 9.207 L15.5 8.5 L17.793 7.793 Z" />
    {/* Sparkle 2 (bottom-left, smaller, for balance) - 4 pointed star */}
    <path d="M5.5 13.5 L5.8535 14.6465 L7 15 L5.8535 15.3535 L5.5 16.5 L5.1465 15.3535 L4 15 L5.1465 14.6465 Z" fillOpacity="0.7" />
  </svg>
);

export default DivineEyeIcon;
