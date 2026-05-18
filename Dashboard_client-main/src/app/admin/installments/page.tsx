'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Clock, AlertTriangle, Search, Calendar } from 'lucide-react';
import { getAdminInstallments, AdminInstallment as Installment } from '@/lib/api';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PAID: { label: 'Payé', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: CheckCircle },
  PENDING: { label: 'En attente', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: Clock },
  OVERDUE: { label: 'En retard', color: 'text-red-400', bg: 'bg-red-400/10', icon: AlertTriangle },
};

export default function InstallmentsPage() {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    getAdminInstallments()
      .then(setInstallments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = installments
    .filter((i) => filter === 'ALL' || i.status === filter)
    .filter(
      (i) =>
        String(i.id).includes(search) ||
        String(i.creditRequestId).includes(search) ||
        (i.productName || '').toLowerCase().includes(search.toLowerCase())
    );

  const counts: Record<string, number> = { ALL: installments.length, PAID: 0, PENDING: 0, OVERDUE: 0 };
  installments.forEach((i) => {
    if (counts[i.status] !== undefined) counts[i.status]++;
  });

  const totalAmount = installments.reduce((s, i) => s + i.amount, 0);
  const paidAmount = installments.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Suivi des Échéances</h1>
          <p className="text-gray-500 mt-1">{installments.length} échéance(s) au total</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-[#111827] border border-white/5 rounded-xl px-4 py-2">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold text-white">{Math.round(totalAmount)} <span className="text-xs text-gray-500">DT</span></p>
          </div>
          <div className="bg-[#111827] border border-white/5 rounded-xl px-4 py-2">
            <p className="text-xs text-gray-500">Encaissé</p>
            <p className="text-lg font-bold text-emerald-400">{Math.round(paidAmount)} <span className="text-xs text-gray-500">DT</span></p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par ID, crédit, produit..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#111827] border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
        <div className="flex gap-2">
          {(['ALL', 'PENDING', 'PAID', 'OVERDUE'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-[#111827] text-gray-500 border border-white/10 hover:text-white hover:bg-[#0a0f1c]'
              }`}
            >
              {s === 'ALL' ? 'Tous' : statusConfig[s]?.label} ({counts[s] || 0})
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
                  {['ID', 'Crédit', 'Produit', 'Montant', 'Échéance', 'Payé le', 'Statut'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((inst) => {
                  const status = statusConfig[inst.status] || statusConfig.PENDING;
                  const Icon = status.icon;
                  const isOverdue = inst.status === 'PENDING' && new Date(inst.dueDate) < new Date();
                  const displayStatus = isOverdue ? statusConfig.OVERDUE : status;
                  const DisplayIcon = isOverdue ? AlertTriangle : Icon;

                  return (
                    <tr key={inst.id} className="hover:bg-[#0a0f1c] transition-colors">
                      <td className="px-5 py-4 text-sm text-gray-400 font-mono">#{inst.id}</td>
                      <td className="px-5 py-4 text-sm text-indigo-400 font-medium">Credit #{inst.creditRequestId}</td>
                      <td className="px-5 py-4 text-sm text-white">{inst.productName || '—'}</td>
                      <td className="px-5 py-4 text-sm text-white font-semibold">{Math.round(inst.amount ?? 0)} DT</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(inst.dueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {inst.paidDate
                          ? new Date(inst.paidDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${displayStatus.color} ${displayStatus.bg}`}>
                          <DisplayIcon className="w-3.5 h-3.5" />
                          {displayStatus.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-500 text-sm">
                      Aucune échéance trouvée
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
