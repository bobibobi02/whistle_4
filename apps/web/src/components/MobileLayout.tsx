import Link from 'next/link';
import { ReactNode } from 'react';

interface MobileLayoutProps {
  children: ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-semibold text-gray-900 dark:text-white">
            Whistle
          </Link>
          <nav aria-label="Main navigation" className="hidden md:flex space-x-4">
            <Link href="/" className="text-gray-700 dark:text-gray-200 hover:underline">
              Home
            </Link>
            <Link href="/mod/dashboard" className="text-gray-700 dark:text-gray-200 hover:underline">
              Dashboard
            </Link>
          </nav>
          <div className="md:hidden">
            <button aria-label="Open menu" className="text-gray-700 dark:text-gray-200 focus:outline-none focus:ring">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      <main id="content" className="flex-grow max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
      <footer className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 py-4 text-center">
         2025 Whistle. All rights reserved.
      </footer>
    </div>
  );
}

