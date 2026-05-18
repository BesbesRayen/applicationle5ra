'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ExternalLink, MapPin, Globe, Store, Calendar,
  Building2, ShoppingBag, CheckCircle2, Shield, Clock, Zap,
  Star, ChevronRight, Smartphone,
} from 'lucide-react';
import { boutiques } from '@/data/boutiques';
import QRModal from '@/components/QRModal';

// ── Installment simulator ─────────────────────────────────────────────────────
function parsePrice(priceStr: string): number {
  return parseFloat(priceStr.replace(/[^\d.]/g, '')) || 0;
}

function InstallmentSimulator({ price }: { price: number }) {
  const [months, setMonths] = useState(3);
  const [simulation, setSimulation] = useState<{
    monthlyAmount: number;
    totalPayable: number;
    interestAmount: number;
    interestRate: number;
    financedAmount: number;
    downPayment: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const options = [
    { m: 3, label: '3×', badge: 'Gratuit' },
    { m: 6, label: '6×', badge: '+3% total' },
    { m: 9, label: '9×', badge: '+6% total' },
    { m: 12, label: '12×', badge: '+12% total' },
  ];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8082'}/api/credits/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        totalAmount: price,
        downPayment: price * 0.2,
        numberOfInstallments: months,
      }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => {
        if (!cancelled) setSimulation(data);
      })
      .catch(() => {
        if (!cancelled) setSimulation(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [months, price]);

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-5 text-white">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-indigo-200" />
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
          Simulateur mensualités
        </span>
      </div>
      <p className="text-3xl font-black mb-1">
        {loading || !simulation ? '...' : simulation.monthlyAmount.toLocaleString('fr-TN', { maximumFractionDigits: 1 })} TND
        <span className="text-base font-semibold text-indigo-200">/mois</span>
      </p>
      {simulation && simulation.interestAmount > 0 ? (
        <p className="text-xs text-indigo-300 mb-3">
          Total {simulation.totalPayable.toLocaleString('fr-TN', { maximumFractionDigits: 1 })} TND
          (+{simulation.interestAmount.toLocaleString('fr-TN', { maximumFractionDigits: 1 })} TND intérêts sur montant financé)
        </p>
      ) : simulation ? (
        <p className="text-xs text-emerald-300 font-bold mb-3">0 DT de frais — gratuit</p>
      ) : (
        <p className="text-xs text-indigo-300 mb-3">Calcul de la simulation...</p>
      )}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {options.map((opt) => (
          <button
            key={opt.m}
            onClick={() => setMonths(opt.m)}
            className={`py-2.5 rounded-2xl text-xs font-bold border transition-all ${
              months === opt.m
                ? 'bg-white text-indigo-700 border-white shadow'
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            }`}
          >
            <span className="block text-sm font-black">{opt.label}</span>
            <span className="block text-[10px] opacity-75">{opt.badge}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Product card ──────────────────────────────────────────────────────────────
function ProductCard({
  name, price, emoji, onBuy,
}: { name: string; price: string; emoji: string; onBuy: () => void }) {
  const [simOpen, setSimOpen] = useState(false);
  const numPrice = parsePrice(price);

  return (
    <div className="bg-[#111827] rounded-3xl border border-white/10 overflow-hidden hover:border-indigo-500/30 transition-colors group">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 group-hover:scale-105 transition-transform">
            {emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white leading-snug">{name}</h3>
            <p className="text-xl font-black text-white mt-1">{price}</p>
            {numPrice > 0 && (
              <p className="text-xs text-emerald-400 font-bold mt-0.5">
                à partir de {(numPrice / 3).toLocaleString('fr-TN', { maximumFractionDigits: 0 })} TND/mois
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/20">
            <Zap className="w-2.5 h-2.5" /> 3× gratuit
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-violet-500/20 text-violet-400 rounded-full border border-violet-500/20">
            6× ou 12× dispo
          </span>
        </div>
      </div>

      <button
        onClick={() => setSimOpen(!simOpen)}
        className="w-full text-left px-5 py-2.5 border-t border-white/5 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/10 transition-colors flex items-center justify-between"
      >
        Voir les mensualités
        <ChevronRight className={`w-4 h-4 transition-transform ${simOpen ? 'rotate-90' : ''}`} />
      </button>

      {simOpen && numPrice > 0 && (
        <div className="px-4 pb-4">
          <InstallmentSimulator price={numPrice} />
        </div>
      )}

      <div className="px-4 pb-4 pt-1">
        <button
          onClick={onBuy}
          className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl transition-colors"
        >
          <Smartphone className="w-4 h-4" />
          Acheter sur l&apos;app
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BoutiqueDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const boutique = boutiques.find((b) => b.id === id);
  const [qrModal, setQrModal] = useState<{ open: boolean; link: string; name: string }>({
    open: false, link: '', name: '',
  });

  const openQR = (path: string, label: string) =>
    setQrModal({ open: true, link: `creditn://${path}`, name: label });

  if (!boutique) {
    return (
      <div className="pt-20 min-h-screen bg-[#0a0f1c] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Store className="w-10 h-10 text-gray-600" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">Boutique introuvable</h1>
          <Link href="/boutiques" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour aux boutiques
          </Link>
        </div>
      </div>
    );
  }

  const domain = boutique.website.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <>
      <div className="min-h-screen bg-[#0a0f1c] pt-16">
        {/* Banner */}
        <div className={`relative h-44 sm:h-56 bg-gradient-to-r ${boutique.bannerGradient}`}>
          <div className="absolute inset-0 bg-black/15" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 h-full flex items-start pt-5">
            <Link
              href="/boutiques"
              className="inline-flex items-center gap-2 text-sm font-bold text-white/90 hover:text-white bg-black/15 backdrop-blur-sm px-4 py-2 rounded-2xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 pb-24 relative z-10">
          {/* Profile header card */}
          <div className="bg-[#111827] rounded-3xl border border-white/10 p-6 sm:p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-5xl flex-shrink-0">
                {boutique.logo}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-white">{boutique.name}</h1>
                  {boutique.conventionActive && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Partenaire vérifié
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {boutique.city}</span>
                  <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {boutique.locations} magasins</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Depuis {boutique.founded}</span>
                </div>
                <span className="inline-block px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-full">
                  {boutique.category}
                </span>
              </div>
              <div className="flex flex-col gap-2 w-full sm:w-auto flex-shrink-0">
                <a
                  href={boutique.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Visiter le site
                </a>
                <button
                  onClick={() => openQR(`shop?name=${encodeURIComponent(boutique.name)}`, boutique.name)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-gray-300 text-sm font-bold rounded-2xl hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-300 transition-colors"
                >
                  <Smartphone className="w-4 h-4" /> Ouvrir dans l&apos;app
                </button>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: About + Products */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-[#111827] rounded-3xl border border-white/10 p-6">
                <h2 className="text-lg font-black text-white mb-3 flex items-center gap-2">
                  <Store className="w-5 h-5 text-indigo-400" /> À propos
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">{boutique.longDescription}</p>
              </div>

              <div className="bg-[#111827] rounded-3xl border border-white/10 p-6">
                <h2 className="text-lg font-black text-white mb-5 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-indigo-400" /> Produits populaires
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {boutique.products.map((product, idx) => (
                    <ProductCard
                      key={idx}
                      name={product.name}
                      price={product.price}
                      emoji={product.emoji}
                      onBuy={() =>
                        openQR(
                          `product?shopName=${encodeURIComponent(boutique.name)}&productName=${encodeURIComponent(product.name)}`,
                          product.name,
                        )
                      }
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* BNPL options */}
              <div className="bg-[#111827] rounded-3xl border border-white/10 p-6">
                <h3 className="text-sm font-black text-white mb-4">Payer avec CreditTN</h3>
                <div className="space-y-3">
                  {[
                    { label: '3 mois',  sublabel: 'Gratuit — 0% de frais',    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', Icon: Zap },
                    { label: '6 mois',  sublabel: '+3% sur le total',          color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',   Icon: Clock },
                    { label: '9 mois',  sublabel: '+6% sur le total',          color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',  Icon: Clock },
                    { label: '12 mois', sublabel: '+12% sur le total',         color: 'bg-violet-500/10 text-violet-400 border-violet-500/20', Icon: Star },
                  ].map((opt) => (
                    <div key={opt.label} className={`flex items-center gap-3 p-3 rounded-2xl border ${opt.color}`}>
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                        <opt.Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-black">{opt.label}</p>
                        <p className="text-xs opacity-70">{opt.sublabel}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => openQR(`shop?name=${encodeURIComponent(boutique.name)}`, 'Acheter maintenant')}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 transition-colors"
                >
                  <Smartphone className="w-4 h-4" /> Acheter maintenant
                </button>
              </div>

              {/* Store info */}
              <div className="bg-[#111827] rounded-3xl border border-white/10 p-6">
                <h3 className="text-sm font-black text-white mb-4">Informations</h3>
                <div className="space-y-3.5">
                  <div className="flex items-start gap-3">
                    <Globe className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Site web</p>
                      <a href={boutique.website} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:underline font-medium">{domain}</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Siège</p>
                      <p className="text-sm text-gray-300 font-medium">{boutique.city}, Tunisie</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Points de vente</p>
                      <p className="text-sm text-gray-300 font-medium">{boutique.locations} magasins</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Fondée</p>
                      <p className="text-sm text-gray-300 font-medium">{boutique.founded}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div className="bg-[#111827] rounded-3xl border border-white/10 p-6">
                <h3 className="text-sm font-black text-white mb-4">Garanties CreditTN</h3>
                <div className="space-y-3">
                  {[
                    { Icon: Shield,       text: 'Paiement 100% sécurisé' },
                    { Icon: Clock,        text: 'Approbation en quelques minutes' },
                    { Icon: CheckCircle2, text: 'Partenaire officiel vérifié' },
                  ].map((g) => (
                    <div key={g.text} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <g.Icon className="w-4 h-4 text-indigo-400" />
                      </div>
                      <p className="text-sm text-gray-400">{g.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <QRModal
        isOpen={qrModal.open}
        onClose={() => setQrModal((s) => ({ ...s, open: false }))}
        deepLink={qrModal.link}
        productName={qrModal.name}
      />
    </>
  );
}
