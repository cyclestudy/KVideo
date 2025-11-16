import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function Badge({ children, variant = 'primary', className = '' }: BadgeProps) {
  const variants = {
    primary: "bg-[var(--accent-color)] text-white",
    secondary: "bg-[var(--glass-bg)] backdrop-blur-[10px] border border-[var(--glass-border)] text-[var(--text-color)]",
  };

  return (
    <span 
      className={`
        inline-flex items-center justify-center
        px-3 py-1
        rounded-[var(--radius-full)]
        text-xs font-semibold
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

