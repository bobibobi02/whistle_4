import React from 'react';

export function Button({
  children,
  variant = 'ghost',
  size = 'sm',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'ghost' | 'primary';
  size?: 'sm' | 'md';
}) {
  let base = 'inline-flex items-center justify-center rounded focus:outline-none transition';
  let sizeClasses = size === 'sm' ? 'px-2 py-1 text-sm' : 'px-4 py-2 text-base';
  let variantClasses =
    variant === 'ghost'
      ? 'bg-transparent hover:bg-gray-100'
      : 'bg-indigo-600 text-white hover:bg-indigo-700';

  return (
    <button className={`${base} ${sizeClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  );
}
