'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, CreditCard, Search } from 'lucide-react';
import { getAdminCredits, approveCredit, rejectCredit, AdminCredit } from '@/lib/api';

type CreditRequest = AdminCredit;

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  APPROVED: { label: 'Approuvé', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: CheckCircle },
  PENDING: { label: 'En attente', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: Clock },
  REJECTED: { label: 'Rejeté', color: 'text-red-400', bg: 'bg-red-400/10', icon: XCircle },
};

export default function CreditsPage() {
  const [credits, setCredits] = useState<CreditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadCredits = async () => {
    getAdminCredits()
      .then(setCredits)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCredits(); }, []);

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    setActionLoading(id);
    try {
      if (action === 'approve') await approveCredit(id);
      else await rejectCredit(id);
      setCredits((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: action === 'approve' ? 'APPROVED' : 'REJECTED' } : c))
      );
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const filtered = credits
    .filter((c) => filter === 'ALL' || c.status === filter)
    .filter(
      (c) =>
        c.productName?.toLowerCase().includes(search.toLowerCase()) ||
        String(c.id).includes(search) ||
        String(c.userId).includes(search)
    );

  const counts = { ALL: credits.length, PENDING: 0, APPROVED: 0, REJECTED: 0 };
  credits.forEach((c) => { if (counts[c.status as keyof typeof counts] !== undefined) counts[c.status as keyof typeof counts]++; });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-white">Gestion des Crédits</h1>
        <p className="text-gray-500 mt-1">{credits.length} demande(s) au total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par produit, ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#111827] border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
        <div className="flex gap-2">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-[#111827] text-gray-500 border border-white/10 hover:text-white hover:bg-[#0a0f1c]'
              }`}
            >
              {s === 'ALL' ? 'Tous' : statusConfig[s]?.label} ({counts[s]})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center h-40 items-center">
          <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['ID', 'Utilisateur', 'Produit', 'Montant', 'Échéances', 'Statut', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((credit) => {
                  const status = statusConfig[credit.status] || statusConfig.PENDING;
                  const Icon = status.icon;
                  return (
                    <tr key={credit.id} className="hover:bg-[#0a0f1c] transition-colors">
                      <td className="px-5 py-4 text-sm text-gray-400 font-mono">#{credit.id}</td>
                      <td className="px-5 py-4 text-sm text-gray-400">User #{credit.userId}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-indigo-400" />
                          <span className="text-sm text-white font-medium">{credit.productName || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-white font-semibold">
                        {Math.round(credit.totalAmount ?? 0)} DT
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">{credit.numberOfInstallments ?? 0}×</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.color} ${status.bg}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {new Date(credit.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-5 py-4">
                        {credit.status === 'PENDING' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAction(credit.id, 'approve')}
                              disabled={actionLoading === credit.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              Approuver
                            </button>
                            <button
                              onClick={() => handleAction(credit.id, 'reject')}
                              disabled={actionLoading === credit.id}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              Rejeter
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-gray-500 text-sm">
                      Aucun crédit trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
