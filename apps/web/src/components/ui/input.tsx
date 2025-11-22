import React from 'react';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300 ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
