'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  CreditCard,
  CalendarClock,
  Package,
  FileText,
  Bell,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
  import { Mail } from 'lucide-react';

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/kyc', label: 'Vérification KYC', icon: ShieldCheck },
  { href: '/admin/credits', label: 'Demandes Crédit', icon: CreditCard },
  { href: '/admin/installments', label: 'Échéances', icon: CalendarClock },
  { href: '/admin/articles', label: 'Articles', icon: Package },
  { href: '/admin/invoices', label: 'Factures', icon: FileText },
  { href: '/admin/notifications', label: 'Alertes Crédit', icon: Bell },
    { href: '/admin/messages', label: 'Messages Reçus', icon: Mail },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name: string; email: string } | null>(null);
  const [checking, setChecking] = useState(() => pathname !== '/admin/login');

  useEffect(() => {
    if (pathname === '/admin/login') {
      return;
    }

    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');

    if (!token) {
      window.location.href = '/admin/login';
      return;
    }

    if (user) {
      try {
        const parsed = JSON.parse(user);
        setAdminUser({ name: parsed.name || 'Admin', email: parsed.email || '' });
      } catch {
        setAdminUser({ name: 'Admin', email: '' });
      }
    }
    setChecking(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/admin/login';
  };

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400 animate-pulse">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0f1c]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#111827] border-r border-white/5 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-2 px-6 h-16 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">
            Creadi<span className="text-indigo-400">TN</span>
          </span>
          <span className="ml-auto text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
            ADMIN
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-400 shadow-sm border border-indigo-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/5">
          {adminUser && (
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-medium text-white truncate">{adminUser.name}</p>
              <p className="text-xs text-gray-500 truncate">{adminUser.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="h-16 bg-[#111827]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-gray-400"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="hidden lg:block">
            <h2 className="text-sm font-medium text-gray-400">
              {sidebarLinks.find((l) => l.href === pathname)?.label || 'Admin'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-xs font-bold text-white">
              A
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
