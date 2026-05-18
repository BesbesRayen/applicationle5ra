'use client';

import { useEffect, useMemo, useState } from 'react';
import { BellRing, CheckCircle2, RefreshCw, Search } from 'lucide-react';
import {
  AdminCreditNotification,
  getAdminNotifications,
  markAdminNotificationAsRead,
} from '@/lib/api';

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminCreditNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await getAdminNotifications();
      setNotifications(data);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return notifications;
    return notifications.filter((notification) =>
      [notification.title, notification.message, notification.transactionId]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [notifications, search]);

  const markRead = async (id: number) => {
    try {
      await markAdminNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to mark notification');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Alertes Achat Credit</h1>
          <p className="text-gray-500 mt-1">
            {notifications.length} notification(s), {unreadCount} non lue(s)
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#111827] border border-white/10 text-gray-200 rounded-xl text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-red-400/30 bg-red-500/10 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#111827] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500"
          placeholder="Rechercher titre, message, transaction"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-8 bg-[#111827] border border-white/5 rounded-2xl text-center text-gray-500 text-sm">
            Chargement des notifications...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 bg-[#111827] border border-white/5 rounded-2xl text-center text-gray-500 text-sm">
            Aucune notification trouvee
          </div>
        ) : (
          filtered.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-2xl border ${
                notification.read
                  ? 'bg-[#111827] border-white/5'
                  : 'bg-indigo-500/10 border-indigo-500/25'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2">
                    <BellRing className={`w-4 h-4 ${notification.read ? 'text-gray-500' : 'text-indigo-300'}`} />
                    <p className={`text-sm font-semibold ${notification.read ? 'text-gray-300' : 'text-white'}`}>
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-400/20 text-indigo-300 border border-indigo-400/30">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-2">{notification.message}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>
                      {new Date(notification.createdAt).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {notification.transactionId && <span>TX: {notification.transactionId}</span>}
                    {notification.orderId && <span>Order #{notification.orderId}</span>}
                  </div>
                </div>

                {!notification.read && (
                  <button
                    onClick={() => markRead(notification.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Marquer lu
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
