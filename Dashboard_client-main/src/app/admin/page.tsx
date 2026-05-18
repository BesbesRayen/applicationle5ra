'use client';

import { useEffect, useState } from 'react';
import { Users, CreditCard, CalendarClock, ShieldCheck, TrendingUp, AlertCircle, Package, FileText, Bell, Activity, ShoppingBag } from 'lucide-react';
import { getAdminStats, AdminStats, fetchBackend } from '@/lib/api';

interface ActivityEvent {
  type: string;
  icon: string;
  title: string;
  subtitle: string;
  time: string | null;
  color: string;
}

function timeAgo(isoTime: string | null): string {
  if (!isoTime) return '';
  const d = new Date(isoTime);
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return 'À l\'instant';
  if (secs < 3600) return `Il y a ${Math.floor(secs / 60)} min`;
  if (secs < 86400) return `Il y a ${Math.floor(secs / 3600)} h`;
  return `Il y a ${Math.floor(secs / 86400)} j`;
}

const eventColorMap: Record<string, string> = {
  green: 'bg-emerald-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur'))
      .finally(() => setLoading(false));

    fetchBackend<ActivityEvent[]>('/api/admin/activity')
      .then(setActivity)
      .catch(() => setActivity([]))
      .finally(() => setActivityLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
        {error}
      </div>
    );
  }

  const cards = [
    { label: 'Utilisateurs', value: stats?.totalUsers ?? 0, icon: Users, color: 'from-indigo-500 to-indigo-700', bg: 'bg-indigo-500/10' },
    { label: 'Demandes Crédit', value: stats?.totalCredits ?? 0, icon: CreditCard, color: 'from-emerald-500 to-emerald-700', bg: 'bg-emerald-500/10' },
    { label: 'Échéances', value: stats?.totalInstallments ?? 0, icon: CalendarClock, color: 'from-amber-500 to-amber-700', bg: 'bg-amber-500/10' },
    { label: 'KYC en attente', value: stats?.pendingKyc ?? 0, icon: ShieldCheck, color: 'from-rose-500 to-rose-700', bg: 'bg-rose-500/10' },
    { label: 'Articles actifs', value: stats?.totalArticles ?? 0, icon: Package, color: 'from-cyan-500 to-cyan-700', bg: 'bg-cyan-500/10' },
    { label: 'Factures', value: stats?.totalInvoices ?? 0, icon: FileText, color: 'from-fuchsia-500 to-fuchsia-700', bg: 'bg-fuchsia-500/10' },
    { label: 'Alertes crédit', value: stats?.unreadCreditNotifications ?? 0, icon: Bell, color: 'from-orange-500 to-orange-700', bg: 'bg-orange-500/10' },
    { label: 'Achats crédit', value: stats?.creditOrders ?? 0, icon: ShoppingBag, color: 'from-blue-500 to-blue-700', bg: 'bg-blue-500/10' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
        <p className="text-gray-400 mt-1">Vue d&apos;ensemble du système CreadiTN</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-[#111827] border border-white/5 rounded-2xl p-5 hover:shadow-lg hover:border-white/10 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-sm text-gray-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Credit Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Statut des crédits
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-gray-400">Approuvés</span>
              </div>
              <span className="text-lg font-bold text-emerald-400">{stats?.approvedCredits ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-gray-400">En attente</span>
              </div>
              <span className="text-lg font-bold text-amber-400">{stats?.pendingCredits ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-gray-400">Rejetés</span>
              </div>
              <span className="text-lg font-bold text-red-400">{stats?.rejectedCredits ?? 0}</span>
            </div>
          </div>

          {(stats?.totalCredits ?? 0) > 0 && (
            <div className="mt-6">
              <div className="h-3 rounded-full bg-white/5 overflow-hidden flex">
                <div
                  className="bg-emerald-500 transition-all duration-700"
                  style={{ width: `${((stats?.approvedCredits ?? 0) / (stats?.totalCredits ?? 1)) * 100}%` }}
                />
                <div
                  className="bg-amber-500 transition-all duration-700"
                  style={{ width: `${((stats?.pendingCredits ?? 0) / (stats?.totalCredits ?? 1)) * 100}%` }}
                />
                <div
                  className="bg-red-500 transition-all duration-700"
                  style={{ width: `${((stats?.rejectedCredits ?? 0) / (stats?.totalCredits ?? 1)) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Vérifications KYC
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-gray-400">Vérifiés</span>
              </div>
              <span className="text-lg font-bold text-emerald-400">{stats?.approvedKyc ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-gray-400">En attente</span>
              </div>
              <span className="text-lg font-bold text-amber-400">{stats?.pendingKyc ?? 0}</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <p className="text-xs text-indigo-300">
              Les vérifications KYC sont traitées automatiquement par l&apos;IA Didit.
              Vous pouvez aussi approuver/rejeter manuellement depuis la page KYC.
            </p>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          Activité récente
        </h3>

        {activityLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : activity.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">Aucune activité récente</p>
        ) : (
          <div className="space-y-1">
            {activity.map((event, idx) => (
              <div key={idx} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                <div className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${eventColorMap[event.color] ?? 'bg-gray-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{event.title}</p>
                  <p className="text-xs text-gray-400 truncate">{event.subtitle}</p>
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">{timeAgo(event.time)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
