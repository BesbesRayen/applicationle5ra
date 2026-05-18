'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * Renders Navbar + Footer only for public (non-admin) routes.
 * Admin routes (/admin/*) use their own AdminLayout and must NOT
 * inherit the public navigation chrome.
 */
export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const isLanding = pathname === '/';
  const isDark = isLanding || pathname.startsWith('/dashboard') || pathname.startsWith('/boutiques') || pathname === '/login' || pathname === '/register' || pathname.startsWith('/support');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className={isDark ? 'bg-[#0a0f1c]' : 'bg-gray-50'}>
      <Navbar />
      <main className="flex-1">{children}</main>
      {isLanding && <Footer />}
    </div>
  );
}
