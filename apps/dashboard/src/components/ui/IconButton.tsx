import React from 'react';
import './IconButton.css';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: number;
  variant?: 'default' | 'accent' | 'ghost';
}

export function IconButton({
  label,
  size = 44,
  variant = 'default',
  className = '',
  children,
  ...rest
}: IconButtonProps) {
  const classes = [
    'icon-btn',
    `icon-btn--${variant}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      aria-label={label}
      type="button"
      {...rest}
    >
      {children}
    </button>
  );
}
