import React, { PropsWithChildren } from 'react';

export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <div className={`bg-white shadow-sm rounded-2xl ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <div className={`p-4 border-b ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <div className={`p-4 border-t ${className}`}>{children}</div>;
}
