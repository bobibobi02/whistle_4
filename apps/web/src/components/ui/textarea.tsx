import React from 'react';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300 ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
