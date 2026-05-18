'use client';

import { useEffect, useState } from 'react';
import { Mail, Search, RefreshCw, AlertCircle, Inbox } from 'lucide-react';

interface Message {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

const statusColor: Record<string, string> = {
  unread: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  read: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  replied: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const statusLabel: Record<string, string> = {
  unread: 'Non lu',
  read: 'Lu',
  replied: 'Répondu',
};

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('fr-TN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Message | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
      } else {
        setError(data.message || 'Erreur lors du chargement des messages');
      }
    } catch {
      setError('Impossible de joindre le serveur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = messages.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.subject?.toLowerCase().includes(q) ||
      m.message?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Messages Reçus</h1>
          <p className="text-gray-500 mt-1">{messages.length} message{messages.length !== 1 ? 's' : ''} au total</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="pl-10 pr-4 py-2.5 bg-[#0a0f1c] border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-56"
            />
          </div>
          <button
            onClick={load}
            className="p-2.5 bg-[#0a0f1c] border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-indigo-500/40 transition-colors"
            title="Actualiser"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-sm text-red-400/70 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center h-40 items-center">
          <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-3">
          <Inbox className="w-10 h-10 opacity-40" />
          <p>{search ? 'Aucun résultat pour cette recherche.' : 'Aucun message reçu.'}</p>
        </div>
      )}

      {/* Two-pane layout */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* List */}
          <div className="lg:col-span-2 bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
            <div className="divide-y divide-white/5">
              {filtered.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => setSelected(msg)}
                  className={`w-full text-left p-4 hover:bg-white/5 transition-colors ${selected?.id === msg.id ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-white truncate">{msg.name}</p>
                    <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full border font-medium ${statusColor[msg.status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                      {statusLabel[msg.status] ?? msg.status}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-400 truncate mb-1">{msg.subject}</p>
                  <p className="text-xs text-gray-500 truncate">{msg.message}</p>
                  <p className="text-[11px] text-gray-600 mt-1">{formatDate(msg.created_at)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Detail pane */}
          <div className="lg:col-span-3 bg-[#111827] border border-white/5 rounded-2xl p-6">
            {selected ? (
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-white">{selected.name}</h2>
                    <a href={`mailto:${selected.email}`} className="text-sm text-indigo-400 hover:underline">
                      {selected.email}
                    </a>
                  </div>
                  <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full border font-medium ${statusColor[selected.status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                    {statusLabel[selected.status] ?? selected.status}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Sujet</p>
                  <p className="text-white font-semibold">{selected.subject}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Message</p>
                  <div className="bg-[#0a0f1c] rounded-xl p-4 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {selected.message}
                  </div>
                </div>

                <p className="text-xs text-gray-600">{formatDate(selected.created_at)}</p>

                <a
                  href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Répondre par email
                </a>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-600 gap-3">
                <Mail className="w-10 h-10 opacity-30" />
                <p className="text-sm">Sélectionnez un message pour le lire</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
