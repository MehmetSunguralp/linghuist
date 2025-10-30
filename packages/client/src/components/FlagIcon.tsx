'use client';
import React from 'react';
import * as Flags from 'country-flag-icons/react/3x2';

interface FlagIconProps {
  countryCode?: string | null;
  size?: number;
  title?: string;
  style?: React.CSSProperties;
}

export const FlagIcon: React.FC<FlagIconProps> = ({
  countryCode,
  size = 18,
  title,
  style,
}) => {
  if (!countryCode) return null;
  const code = countryCode.toUpperCase();
  const Component = (Flags as Record<string, React.ComponentType<any>>)[code];
  if (!Component) return null;
  return (
    <Component
      title={title || code}
      style={{ width: size, height: size, borderRadius: 2, ...style }}
    />
  );
};

export default FlagIcon;
