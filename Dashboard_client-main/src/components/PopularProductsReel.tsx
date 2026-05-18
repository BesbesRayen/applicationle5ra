'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import QRModal from '@/components/QRModal';

interface PopularProduct {
  id: number;
  productName: string;
  description: string;
  price: number;
  imageUrl: string;
  boutiqueName: string;
  category: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8082';

const CATEGORY_EMOJI: Record<string, string> = {
  'Informatique & Électronique': '💻',
  'Grande Distribution': '🛒',
  'Mode & Beauté': '👗',
  'Électroménager': '📺',
  'Meubles & Décoration': '🛋️',
  'Sport & Loisirs': '⚽',
};

export default function PopularProductsReel() {
  const [products, setProducts] = useState<PopularProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState<{ open: boolean; link: string; name: string }>({
    open: false,
    link: '',
    name: '',
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/articles/popular?limit=12`)
      .then((r) => r.json())
      .then((data: PopularProduct[]) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  const openQR = (product: PopularProduct) => {
    // Generate a product-specific Expo deep link so the app opens directly on that product
    const params = new URLSearchParams({
      articleId: String(product.id),
      shopName: product.boutiqueName,
    });
    const link = `creditn://product?${params.toString()}`;
    setQrModal({ open: true, link, name: product.productName });
  };

  if (!loading && products.length === 0) return null;

  return (
    <section className="section-padding bg-[#0a0f1c]" id="popular-products">
      <div className="container-custom mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/15 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
                Produits <span className="gradient-text">Populaires</span>
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">Payez en plusieurs fois avec CreditTN</p>
            </div>
          </div>
          {/* Scroll controls */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-xl bg-[#111827] border border-white/5 text-gray-400 hover:text-white hover:border-indigo-500/40 transition-colors"
              aria-label="Défiler à gauche"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-xl bg-[#111827] border border-white/5 text-gray-400 hover:text-white hover:border-indigo-500/40 transition-colors"
              aria-label="Défiler à droite"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reel */}
        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-52 h-72 bg-[#111827] rounded-2xl animate-pulse border border-white/5"
              />
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product) => (
              <ProductReelCard
                key={product.id}
                product={product}
                onBuy={() => openQR(product)}
              />
            ))}
          </div>
        )}
      </div>

      <QRModal
        isOpen={qrModal.open}
        onClose={() => setQrModal((s) => ({ ...s, open: false }))}
        deepLink={qrModal.link}
        productName={qrModal.name}
      />
    </section>
  );
}

function ProductReelCard({
  product,
  onBuy,
}: {
  product: PopularProduct;
  onBuy: () => void;
}) {
  const emoji = CATEGORY_EMOJI[product.category] ?? '🏷️';
  const hasImage = product.imageUrl && product.imageUrl.startsWith('http');

  return (
    <div className="group shrink-0 w-52 snap-start flex flex-col bg-[#111827] border border-white/5 rounded-2xl overflow-hidden hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
      {/* Image */}
      <div className="relative h-40 bg-[#0a0f1c] flex items-center justify-center overflow-hidden">
        {hasImage ? (
          <img
            src={product.imageUrl}
            alt={product.productName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="text-5xl group-hover:scale-110 transition-transform duration-300">{emoji}</span>
        )}
        {/* Shop badge */}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-full max-w-[80%] truncate">
          {product.boutiqueName}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2 flex-1">
          {product.productName}
        </h3>
        <div>
          <p className="text-lg font-bold text-indigo-400">
            {product.price.toLocaleString('fr-TN')} TND
          </p>
          <p className="text-xs text-gray-500">
            ≈ {Math.round(product.price / 3).toLocaleString('fr-TN')} TND × 3
          </p>
        </div>
        <button
          onClick={onBuy}
          className="mt-1 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          Acheter maintenant
        </button>
      </div>
    </div>
  );
}
