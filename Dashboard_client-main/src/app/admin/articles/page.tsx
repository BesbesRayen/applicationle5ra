'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ImageIcon,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  AdminArticle,
  AdminArticleInput,
  ProductImportResult,
  createAdminArticle,
  deleteAdminArticle,
  getAdminArticles,
  importProductFromUrl,
  updateAdminArticle,
  uploadArticleImage,
  BACKEND,
} from '@/lib/api';

const emptyForm: AdminArticleInput = {
  productName: '',
  description: '',
  price: 0,
  imageUrl: '',
  boutiqueName: '',
  category: '',
  sourceUrl: '',
};

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<AdminArticle | null>(null);
  const [form, setForm] = useState<AdminArticleInput>(emptyForm);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((a) => a.id)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Supprimer ${selectedIds.size} article(s) sélectionné(s) ?`)) return;
    setDeleting(true);
    setError('');
    const failed: number[] = [];
    for (const id of selectedIds) {
      try {
        await deleteAdminArticle(id);
      } catch {
        failed.push(id);
      }
    }
    setSelectedIds(new Set());
    await loadArticles();
    setDeleting(false);
    if (failed.length > 0) {
      setError(`${failed.length} article(s) n'ont pas pu être supprimés (commandes liées).`);
    }
  };

  // URL import state
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importWarning, setImportWarning] = useState('');
  const [importedPreview, setImportedPreview] = useState<ProductImportResult | null>(null);

  const loadArticles = async () => {
    try {
      const data = await getAdminArticles();
      setArticles(data);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return articles;
    return articles.filter((article) =>
      [article.productName, article.boutiqueName, article.category]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articles, search]);

  const isAllSelected = filtered.length > 0 && filtered.every((a) => selectedIds.has(a.id));
  const isIndeterminate = !isAllSelected && filtered.some((a) => selectedIds.has(a.id));

  const resetModal = () => {
    setOpenModal(false);
    setEditing(null);
    setForm(emptyForm);
    setImagePreview('');
    setImportUrl('');
    setImportError('');
    setImportedPreview(null);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setImagePreview('');
    setImportUrl('');
    setImportError('');
    setImportedPreview(null);
    setOpenModal(true);
  };

  const openEdit = (article: AdminArticle) => {
    setEditing(article);
    setForm({
      productName: article.productName,
      description: article.description,
      price: article.price,
      imageUrl: article.imageUrl,
      boutiqueName: article.boutiqueName,
      category: article.category,
      sourceUrl: article.sourceUrl ?? '',
    });
    const preview = article.imageUrl?.startsWith('/')
      ? `${BACKEND}${article.imageUrl}`
      : article.imageUrl;
    setImagePreview(preview || '');
    setImportUrl('');
    setImportError('');
    setImportedPreview(null);
    setOpenModal(true);
  };
  // ── URL Import ────────────────────────────────────────────────────────────

  // Client-side URL slug extraction for graceful fallback when scraping fails
  function extractFromUrlClientSide(raw: string): { name: string; brand: string } {
    try {
      const url = new URL(raw);
      const hostname = url.hostname.replace(/^www\./, '');
      const domainBrand: Record<string, string> = {
        'decathlon.tn': 'Decathlon', 'decathlon.fr': 'Decathlon',
        'zara.com': 'Zara', 'mytek.tn': 'MyTek', 'megapc.tn': 'Mega PC',
        'tunisianet.com.tn': 'Tunisianet', 'jumia.com.tn': 'Jumia',
        'lacasashops.com': 'La Casa', 'fatales.tn': 'Fatales',
        'mobileplanet.tn': 'Mobile Planet',
      };
      const brand = domainBrand[hostname] ?? hostname.split('.')[0].replace(/-/g, ' ');
      const segments = url.pathname.split('/').filter(Boolean);
      let slug = segments[segments.length - 1] ?? '';
      slug = slug.replace(/\.[a-z]{2,5}$/, '');
      slug = slug.replace(/^\d+-\d+-/, '').replace(/^[\d-]+-/, '');
      // Remove query-string noise (IDs at end like -112778-)
      slug = slug.replace(/-\d{4,}-?.*$/, '');
      const name = slug.split('-').filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ').slice(0, 120);
      return { name, brand };
    } catch {
      return { name: '', brand: '' };
    }
  }

  const handleImportUrl = async () => {
    setImportError('');
    setImportedPreview(null);

    if (!importUrl.trim()) {
      setImportError("Entrez une URL de produit.");
      return;
    }
    if (!/^https?:\/\/.+/.test(importUrl.trim())) {
      setImportError("URL invalide. Elle doit commencer par http:// ou https://");
      return;
    }

    setImportWarning('');
    setImporting(true);
    try {
      const result = await importProductFromUrl(importUrl.trim());

      if (!result.valid) {
        // Graceful fallback: extract what we can from the URL itself
        const fallback = extractFromUrlClientSide(importUrl.trim());
        setForm((prev) => ({
          ...prev,
          productName: fallback.name || prev.productName,
          boutiqueName: fallback.brand || prev.boutiqueName,
          sourceUrl: importUrl.trim(),
        }));
        setImportWarning(
          (result.errorMessage ? result.errorMessage + ' ' : '') +
          'Formulaire pré-rempli depuis l\'URL — vérifiez et complétez manuellement.'
        );
        setImportedPreview(null);
        return;
      }

      // Partial data (e.g. site returned 403 but slug was decoded)
      if (result.errorMessage) setImportWarning(result.errorMessage);

      setImportedPreview(result);

      // Auto-fill the form
      const priceNum = parseFloat((result.price ?? '').replace(',', '.')) || 0;
      setForm((prev) => ({
        ...prev,
        productName: result.name || prev.productName,
        description: result.description || prev.description,
        price: priceNum > 0 ? priceNum : prev.price,
        imageUrl: result.images?.[0] ?? prev.imageUrl,
        boutiqueName: result.brand || prev.boutiqueName,
        category: result.category || prev.category,
        sourceUrl: result.sourceUrl || importUrl.trim(),
      }));

      const firstImage = result.images?.[0];
      if (firstImage) setImagePreview(firstImage);

    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur lors de l'import.";
      if (msg.toLowerCase().includes('deja importe') || msg.toLowerCase().includes('already imported')) {
        setImportError('Ce produit est deja importe.');
      } else {
        setImportError(msg);
      }
    } finally {
      setImporting(false);
    }
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const imageUrl = await uploadArticleImage(file);
      setForm((prev) => ({ ...prev, imageUrl }));
      const previewUrl = `${BACKEND}${imageUrl}`;
      setImagePreview(previewUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onSave = async () => {
    if (!form.productName || !form.description || !form.imageUrl || !form.boutiqueName || !form.category) {
      setError('Please fill all required fields');
      return;
    }

    if (form.price <= 0) {
      setError('Price must be greater than zero');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      if (editing) {
        await updateAdminArticle(editing.id, form);
      } else {
        await createAdminArticle(form);
      }
      const wasEditing = !!editing;
      resetModal();
      setLoading(true);
      await loadArticles();
      setSuccessMsg(wasEditing ? 'Article mis à jour avec succès.' : 'Article créé avec succès.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unable to save article';
      if (msg.toLowerCase().includes('deja importe') || msg.toLowerCase().includes('already imported')) {
        setError('Ce produit est deja importe.');
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
      setLoading(false);
    }
  };

  const onDelete = async (article: AdminArticle) => {
    if (!confirm(`Delete article \"${article.productName}\"?`)) return;
    try {
      await deleteAdminArticle(article.id);
      setArticles((prev) => prev.filter((a) => a.id !== article.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to delete article');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Floating selection bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-[#1e2535] border border-white/10 shadow-2xl shadow-black/60 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              {selectedIds.size}
            </div>
            <span className="text-sm text-gray-300 font-medium">
              article{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
            </span>
          </div>
          <div className="w-px h-5 bg-white/10" />
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Désélectionner
          </button>
          <button
            onClick={onDeleteSelected}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-semibold transition-all shadow-lg shadow-red-900/40"
          >
            {deleting ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Suppression...</>
            ) : (
              <><Trash2 className="w-4 h-4" />Supprimer {selectedIds.size > 1 ? `les ${selectedIds.size}` : 'l\'article'}</>
            )}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Articles Partenaires</h1>
          <p className="text-gray-500 mt-1">
            {articles.length} article{articles.length !== 1 ? 's' : ''} dans le catalogue
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvel article
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-red-400/30 bg-red-500/10 text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#111827] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500"
          placeholder="Rechercher par produit, boutique ou categorie"
        />
      </div>

      {/* Table */}
      <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-5 py-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                  />
                </th>
                {['Image', 'Produit', 'Boutique', 'Categorie', 'Prix', 'Actions'].map((h) => (
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
                    Chargement des articles...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500 text-sm">
                    Aucun article trouve
                  </td>
                </tr>
              ) : (
                filtered.map((article) => (
                  <tr key={article.id} className={`hover:bg-[#0a0f1c] transition-colors ${selectedIds.has(article.id) ? 'bg-indigo-500/5' : ''}`}>
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(article.id)}
                        onChange={() => toggleSelect(article.id)}
                        className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={article.imageUrl}
                        alt={article.productName}
                        className="w-12 h-12 rounded-lg object-cover border border-white/10"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-white font-medium">{article.productName}</p>
                      <p className="text-xs text-gray-500 mt-1 max-w-[280px] truncate">{article.description}</p>
                      {article.sourceUrl && (
                        <a
                          href={article.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-400 hover:underline flex items-center gap-1 mt-1"
                        >
                          <Link2 className="w-3 h-3" />
                          Source
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-300">{article.boutiqueName}</td>
                    <td className="px-5 py-4 text-sm text-gray-400">{article.category}</td>
                    <td className="px-5 py-4 text-sm text-emerald-400 font-semibold">{Math.round(article.price)} TND</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(article)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Modifier
                        </button>
                        <button
                          onClick={() => onDelete(article)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#111827] border border-white/10 rounded-2xl p-6 space-y-5 my-8">

            {/* Modal header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg text-white font-bold">
                {editing ? 'Modifier article' : 'Ajouter article'}
              </h2>
              <button onClick={resetModal} className="p-2 rounded-lg hover:bg-white/10 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Smart URL Import (new articles only) ── */}
            {!editing && (
              <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-indigo-300 text-sm font-semibold">
                  <Sparkles className="w-4 h-4" />
                  Import intelligent depuis une URL produit
                </div>
                <p className="text-xs text-gray-400">
                  Collez l&apos;URL d&apos;un produit (Zara, Decathlon, MyTek, Mega PC…) pour remplir automatiquement le formulaire.
                </p>

                <div className="flex gap-2">
                  <input
                    value={importUrl}
                    onChange={(e) => { setImportUrl(e.target.value); setImportError(''); setImportWarning(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleImportUrl()}
                    placeholder="https://www.exemple.com/produit/..."
                    className="flex-1 px-3 py-2.5 rounded-xl bg-[#0a0f1c] border border-white/10 text-white text-sm placeholder-gray-600 focus:border-indigo-500/50 focus:outline-none"
                  />
                  <button
                    onClick={handleImportUrl}
                    disabled={importing}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyse...
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4" />
                        Importer
                      </>
                    )}
                  </button>
                </div>

                {importError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-400/20 text-red-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    {importError}
                  </div>
                )}

                {importWarning && !importError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-400/20 text-amber-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    {importWarning}
                  </div>
                )}

                {importedPreview && importedPreview.valid && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/20">
                    {importedPreview.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={importedPreview.images[0]}
                        alt={importedPreview.name}
                        className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <p className="text-sm text-white font-medium truncate">{importedPreview.name}</p>
                      </div>
                      {importedPreview.price && (
                        <p className="text-sm text-emerald-400 font-semibold mt-0.5">{importedPreview.price} TND</p>
                      )}
                      {importedPreview.brand && (
                        <p className="text-xs text-gray-400 mt-0.5">Marque: {importedPreview.brand}</p>
                      )}
                      {importedPreview.aiExtracted && (
                        <span className="inline-flex items-center gap-1 text-xs text-violet-300 mt-1">
                          <Sparkles className="w-3 h-3" />
                          Extrait par IA
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Form error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-red-400/30 bg-red-500/10 text-red-300 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={form.productName}
                onChange={(e) => setForm((prev) => ({ ...prev, productName: e.target.value }))}
                placeholder="Nom du produit *"
                className="px-3 py-2.5 rounded-xl bg-[#0a0f1c] border border-white/10 text-white text-sm focus:border-indigo-500/50 focus:outline-none"
              />
              <input
                value={form.price || ''}
                type="number"
                min="0"
                step="0.01"
                onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                placeholder="Prix (TND) *"
                className="px-3 py-2.5 rounded-xl bg-[#0a0f1c] border border-white/10 text-white text-sm focus:border-indigo-500/50 focus:outline-none"
              />
              <input
                value={form.boutiqueName}
                onChange={(e) => setForm((prev) => ({ ...prev, boutiqueName: e.target.value }))}
                placeholder="Boutique / Marque *"
                className="px-3 py-2.5 rounded-xl bg-[#0a0f1c] border border-white/10 text-white text-sm focus:border-indigo-500/50 focus:outline-none"
              />
              <input
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="Categorie *"
                className="px-3 py-2.5 rounded-xl bg-[#0a0f1c] border border-white/10 text-white text-sm focus:border-indigo-500/50 focus:outline-none"
              />
            </div>

            <input
              value={form.imageUrl}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, imageUrl: e.target.value }));
                setImagePreview(e.target.value);
              }}
              placeholder="URL de l'image (ou charger un fichier ci-dessous)"
              className="w-full px-3 py-2.5 rounded-xl bg-[#0a0f1c] border border-white/10 text-white text-sm focus:border-indigo-500/50 focus:outline-none"
            />

            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0a0f1c] border border-white/10 text-gray-300 text-sm hover:border-indigo-500/50 disabled:opacity-60 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {uploading ? 'Chargement...' : 'Charger une image'}
              </button>
              {imagePreview ? (
                <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl border border-dashed border-white/10 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </div>

            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Description *"
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl bg-[#0a0f1c] border border-white/10 text-white text-sm resize-none focus:border-indigo-500/50 focus:outline-none"
            />

            {form.sourceUrl && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Link2 className="w-3 h-3" />
                <span className="truncate">Source: {form.sourceUrl}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={resetModal}
                className="px-4 py-2.5 rounded-xl bg-[#0a0f1c] border border-white/10 text-gray-300 text-sm hover:bg-white/5 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-60 transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Enregistrement...' : editing ? 'Mettre a jour' : 'Creer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
