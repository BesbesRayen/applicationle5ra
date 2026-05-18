'use client';

import { useState, useMemo } from 'react';
import { Search, Store, Zap, ShieldCheck, Clock } from 'lucide-react';
import StoreCard from '@/components/StoreCard';
import { boutiques } from '@/data/boutiques';

const CATEGORIES = ['Toutes', 'Informatique & Électronique', 'Mode & Beauté', 'Électroménager', 'Grande Distribution', 'Meubles & Décoration', 'Sport & Loisirs'];

export default function BoutiquesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('Toutes');

  const filteredBoutiques = useMemo(() => {
    return boutiques.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = category === 'Toutes' || (b as { category?: string }).category === category;
      return matchesSearch && matchesCat;
    });
  }, [searchQuery, category]);

  return (
    <div className="min-h-screen bg-[#0a0f1c] pt-16">
      {/* Hero Header */}
      <div className="bg-[#0d1117] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-4">
              <Store className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-bold text-indigo-400">Réseau partenaire CreditTN</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Achetez maintenant,{' '}
              <span className="text-indigo-400">payez plus tard</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Choisissez parmi nos boutiques partenaires et payez en 3, 6 ou 12 mensualités.
            </p>
            {/* Trust badges */}
            <div className="flex items-center justify-center gap-6 mt-6">
              {[
                { icon: Zap, text: '3× gratuit', color: 'text-emerald-400' },
                { icon: ShieldCheck, text: 'Paiement sécurisé', color: 'text-blue-400' },
                { icon: Clock, text: 'Approbation rapide', color: 'text-purple-400' },
              ].map((b) => (
                <div key={b.text} className="flex items-center gap-1.5">
                  <b.icon className={`w-4 h-4 ${b.color}`} />
                  <span className="text-xs font-semibold text-gray-400">{b.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="max-w-lg mx-auto mt-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher une boutique..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-medium text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  category === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500 font-medium">
            <strong className="text-white">{filteredBoutiques.length}</strong> boutique{filteredBoutiques.length !== 1 ? 's' : ''}
          </p>
        </div>

        {filteredBoutiques.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredBoutiques.map((boutique) => (
              <StoreCard key={boutique.id} boutique={boutique} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto bg-white/5 rounded-3xl flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-gray-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Aucune boutique trouvée</h3>
            <p className="text-gray-500 text-sm">Essayez de modifier vos critères de recherche.</p>
            <button
              onClick={() => { setSearchQuery(''); setCategory('Toutes'); }}
              className="mt-4 px-5 py-2 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 transition-colors"
            >
              Tout afficher
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
