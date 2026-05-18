'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import {
  Menu, X, CreditCard, LogOut, User, Home, ShoppingBag,
  Bell, Gift, BarChart2, Wallet, ChevronDown,
} from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/boutiques', label: 'Shopping', icon: ShoppingBag },
  { href: '/dashboard', label: 'Mes Paiements', icon: Wallet },
  { href: '/support', label: 'Support', icon: Gift },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [jwtUser, setJwtUser] = useState<{ firstName: string; lastName: string; email: string } | null>(null);
  const { data: session } = useSession();

  // Check localStorage for JWT user on mount and listen for changes
  useEffect(() => {
    const readUser = () => {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          setJwtUser(JSON.parse(stored));
        } catch {
          localStorage.removeItem('user');
        }
      } else {
        setJwtUser(null);
      }
    };

    readUser();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'token') readUser();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determine logged-in user from either source
  const isLoggedIn = !!jwtUser || !!session?.user;
  const displayName = jwtUser
    ? `${jwtUser.firstName} ${jwtUser.lastName}`.trim()
    : session?.user?.name || '';

  const handleLogout = async () => {
    // Clear JWT auth
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setJwtUser(null);
    // Clear NextAuth session (if any) and redirect to home
    if (session) {
      signOut({ callbackUrl: '/' });
    } else {
      window.location.href = '/';
    }
  };

  const pathname = usePathname();

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0d1117]/95 backdrop-blur-xl border-b border-white/10'
          : 'bg-[#0d1117]/80 backdrop-blur-md'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <nav className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-200 group-hover:shadow-lg transition-all">
              <CreditCard className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Credit<span className="text-indigo-400">TN</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-2xl transition-all duration-200 ${
                    active
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Notifications bell */}
            {isLoggedIn && (
              <button className="relative p-2 rounded-2xl hover:bg-white/5 transition-colors">
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full" />
              </button>
            )}
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                {/* Credit score badge */}
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl hover:border-indigo-500/40 transition-all"
                >
                  <BarChart2 className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-300">Score Crédit</span>
                </Link>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-2xl border border-white/10">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-white">{displayName.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-2xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-indigo-300 rounded-2xl hover:bg-indigo-500/10 transition-all"
                >
                  Se connecter
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-sm shadow-indigo-500/30 hover:shadow-md transition-all"
                >
                  Commencer
                </Link>
              </div>
            )}
          </div>

          {/* Mobile: icons + menu */}
          <div className="md:hidden flex items-center gap-2">
            {isLoggedIn && (
              <button className="relative p-2 rounded-2xl hover:bg-white/5 transition-colors">
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-2xl hover:bg-white/5 transition-colors"
              aria-label="Menu"
            >
              {isOpen ? <X className="w-5 h-5 text-gray-300" /> : <Menu className="w-5 h-5 text-gray-300" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-[#111827] border-t border-white/10 animate-fade-in">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-2xl transition-colors ${
                      active ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}
              <div className="pt-3 mt-3 border-t border-white/10 space-y-2">
                {isLoggedIn ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{displayName}</p>
                        <p className="text-xs text-indigo-400">Voir mon score crédit</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setIsOpen(false); handleLogout(); }}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-2xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="block w-full text-center px-4 py-3 text-sm font-semibold text-gray-300 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors"
                    >
                      Se connecter
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsOpen(false)}
                      className="block w-full text-center px-4 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-colors"
                    >
                      Commencer gratuitement
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
