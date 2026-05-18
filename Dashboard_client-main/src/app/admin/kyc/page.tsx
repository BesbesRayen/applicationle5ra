'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { getAdminKycDocuments, approveKyc, rejectKyc, AdminKycDocument as KycDocument } from '@/lib/api';

export default function KycPage() {
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const loadDocuments = async () => {
    getAdminKycDocuments()
      .then((docs) => setDocuments(docs.filter((d) => d.status === 'PENDING')))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDocuments(); }, []);

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await approveKyc(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleReject = async () => {
    if (!rejectId || !comment.trim()) return;
    setActionLoading(rejectId);
    try {
      await rejectKyc(rejectId, comment);
      setDocuments((prev) => prev.filter((d) => d.id !== rejectId));
    } catch { /* ignore */ }
    setRejectId(null);
    setComment('');
    setActionLoading(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-white">Vérification KYC</h1>
        <p className="text-gray-500 mt-1">{documents.length} demande(s) en attente</p>
      </div>

      {loading ? (
        <div className="flex justify-center h-40 items-center">
          <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-[#111827] border border-white/5 rounded-2xl p-12 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Toutes les vérifications sont traitées</p>
          <p className="text-gray-500 text-sm mt-1">Aucune demande KYC en attente</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-[#111827] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-400 uppercase">En attente</span>
                    <span className="text-xs text-gray-500">
                      — Soumis le {new Date(doc.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-white font-medium">Utilisateur #{doc.userId}</p>
                  <p className="text-gray-500 text-sm">Document #{doc.id} · CIN: {doc.cinNumber || 'N/A'}</p>
                  {doc.faceMatchScore !== null && doc.faceMatchScore !== undefined && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-gray-400">Correspondance faciale IA :</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          doc.faceMatchScore >= 0.8
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : doc.faceMatchScore >= 0.6
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {Math.round(doc.faceMatchScore * 100)}%
                      </span>
                      {doc.faceMatchScore < 0.6 && (
                        <span className="text-xs text-red-400">— Score faible, vérification manuelle requise</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    {[doc.cinFrontUrl, doc.cinBackUrl, doc.selfieUrl].filter(Boolean).map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setPreviewUrl(`http://localhost:8082${url}`)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#0a0f1c] border border-white/10 rounded-lg text-xs text-gray-400 hover:bg-[#111827]/10 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {['CIN Recto', 'CIN Verso', 'Selfie'][i]}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handleApprove(doc.id)}
                    disabled={actionLoading === doc.id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approuver
                  </button>
                  <button
                    onClick={() => setRejectId(doc.id)}
                    disabled={actionLoading === doc.id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Rejeter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectId !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-4">Rejeter la vérification #{rejectId}</h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Motif du rejet (obligatoire)..."
              rows={3}
              className="w-full px-4 py-3 bg-[#0a0f1c] border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleReject}
                disabled={!comment.trim()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Confirmer le rejet
              </button>
              <button
                onClick={() => { setRejectId(null); setComment(''); }}
                className="flex-1 py-2.5 bg-[#0a0f1c] border border-white/10 text-gray-400 rounded-xl text-sm font-semibold hover:bg-[#111827]/10 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <div className="max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="KYC Document" className="max-w-full max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
