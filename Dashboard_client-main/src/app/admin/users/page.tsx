'use client';

import { useEffect, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { getAdminUsers, deleteAdminUser, AdminUser as User } from '@/lib/api';

const statusColor: Record<string, string> = {
  APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
  NOT_SUBMITTED: 'bg-[#0a0f1c]0/10 text-gray-500 border-gray-500/20',
};

const statusLabel: Record<string, string> = {
  APPROVED: 'Vérifié',
  PENDING: 'En attente',
  REJECTED: 'Rejeté',
  NOT_SUBMITTED: 'Non soumis',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Supprimer ce compte utilisateur ? Cette action est irréversible.')) return;
    setDeletingId(userId);
    try {
      await deleteAdminUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      alert('Impossible de supprimer cet utilisateur.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    getAdminUsers()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Utilisateurs</h1>
          <p className="text-gray-500 mt-1">{users.length} utilisateurs inscrits</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="pl-10 pr-4 py-2.5 bg-[#0a0f1c] border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center h-40 items-center">
          <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Téléphone</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">KYC</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Inscription</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-[#0a0f1c] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-xs font-bold text-white">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-gray-500">{user.profession || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-400">{user.email}</td>
                    <td className="px-5 py-4 text-gray-400">{user.phone || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor[user.kycStatus] || statusColor.NOT_SUBMITTED}`}>
                        {statusLabel[user.kycStatus] || 'Inconnu'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={deletingId === user.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        {deletingId === user.id ? '…' : 'Supprimer'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-gray-500">
                      Aucun utilisateur trouvé
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
