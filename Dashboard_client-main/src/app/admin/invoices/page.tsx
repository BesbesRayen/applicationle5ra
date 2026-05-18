'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Search } from 'lucide-react';
import { AdminInvoice, downloadAdminInvoicePdf, getAdminInvoices } from '@/lib/api';

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<number | null>(null);

  useEffect(() => {
    getAdminInvoices()
      .then(setInvoices)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load invoices'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return invoices;
    return invoices.filter((invoice) =>
      [
        invoice.invoiceNumber,
        invoice.transactionId,
        invoice.clientName,
        invoice.clientEmail,
        invoice.articleName,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [invoices, search]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Factures Credit</h1>
          <p className="text-gray-500 mt-1">{invoices.length} facture(s) generee(s)</p>
        </div>
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
          placeholder="Rechercher facture, transaction, client, article"
        />
      </div>

      <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Facture', 'Client', 'Article', 'Montant', 'Mensualites', 'Date achat', 'PDF'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500 text-sm">
                    Chargement des factures...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500 text-sm">
                    Aucune facture trouvee
                  </td>
                </tr>
              ) : (
                filtered.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-[#0a0f1c] transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm text-indigo-300 font-semibold">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-gray-500 mt-1">{invoice.transactionId}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-white font-medium">{invoice.clientName}</p>
                      <p className="text-xs text-gray-500 mt-1">{invoice.clientEmail}</p>
                      <p className="text-xs text-gray-600 mt-1">{invoice.clientPhone || '-'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-300" />
                        <div>
                          <p className="text-sm text-white">{invoice.articleName}</p>
                          <p className="text-xs text-gray-500 mt-1">{invoice.boutiqueName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-emerald-400 font-semibold">
                      {Math.round(invoice.totalPrice)} TND
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-300">{invoice.numberOfInstallments}x</td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {new Date(invoice.purchaseDate).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={async () => {
                          setDownloading(invoice.id);
                          try {
                            await downloadAdminInvoicePdf(invoice.id, invoice.invoiceNumber);
                          } catch {
                            setError('Impossible de télécharger la facture.');
                          } finally {
                            setDownloading(null);
                          }
                        }}
                        disabled={downloading === invoice.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {downloading === invoice.id ? '...' : 'PDF'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
