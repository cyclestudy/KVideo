import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  children, 
  className = '', 
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center px-6 py-3 font-semibold text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: `
      bg-[var(--accent-color)] 
      text-white 
      border-none 
      rounded-[var(--radius-2xl)] 
      shadow-[0_2px_8px_color-mix(in_srgb,var(--shadow-color)_50%,transparent)]
      hover:brightness-110 
      hover:shadow-[0_4px_12px_color-mix(in_srgb,var(--shadow-color)_70%,transparent)]
      active:scale-[0.98] 
      active:brightness-95
    `,
    secondary: `
      bg-[var(--glass-bg)] 
      backdrop-blur-xl 
      border 
      border-[var(--glass-border)] 
      rounded-[var(--radius-2xl)]
      text-[var(--text-color)]
      shadow-[0_2px_8px_color-mix(in_srgb,var(--shadow-color)_50%,transparent)]
      hover:brightness-110
      hover:shadow-[0_4px_12px_color-mix(in_srgb,var(--shadow-color)_70%,transparent)]
      active:scale-[0.98]
    `,
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}


