'use client';

import Link from 'next/link';
import { ArrowRight, Play, Shield, Zap, TrendingUp } from 'lucide-react';

function scrollToDemo() {
  const el = document.getElementById('how-it-works') ?? document.getElementById('features');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1c] via-[#111827] to-[#0f0f2a]" />
        {/* Decorative blobs */}
          <div className="absolute top-20 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-20 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, #3381ff 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-slide-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
              <span className="w-2 h-2 bg-accent-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-indigo-400">
                Nouveau en Tunisie — Paiement échelonné
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-tight text-balance">
              Achetez maintenant,{' '}
              <span className="gradient-text">payez plus tard</span>{' '}
              en toute simplicité
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-400 leading-relaxed max-w-lg">
              CreditTN vous permet de diviser vos achats en{' '}
              <strong className="text-white">3, 6 ou 12 mensualités</strong> dans
              vos boutiques préférées en Tunisie. Sans surprises, sans stress.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link href="/register" className="btn-primary text-base !px-8 !py-4 gap-2">
                Commencer gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                onClick={scrollToDemo}
                className="btn-secondary text-base !px-8 !py-4 gap-2"
              >
                <Play className="w-5 h-5 text-indigo-400" />
                Voir la démo
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent-600" />
                <span className="text-sm text-gray-400">100% Sécurisé</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="text-sm text-gray-400">Approbation instantanée</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <span className="text-sm text-gray-400">0% intérêt</span>
              </div>
            </div>
          </div>

          {/* Right - Phone Mockup */}
          <div className="relative flex justify-center lg:justify-end animate-fade-in">
            <div className="relative">
              {/* Phone Frame */}
              <div className="w-72 h-[580px] bg-[#0a0f1c] rounded-[3rem] p-3 shadow-2xl shadow-black/30 animate-float">
                <div className="w-full h-full bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 rounded-[2.4rem] overflow-hidden relative">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#0a0f1c] rounded-b-2xl" />

                  {/* Screen Content */}
                  <div className="p-6 pt-10 text-white space-y-6">
                    <div className="text-center space-y-2 pt-4">
                      <div className="w-16 h-16 mx-auto bg-[#111827]/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                        <span className="text-3xl">💳</span>
                      </div>
                      <h3 className="text-lg font-bold">CreditTN</h3>
                      <p className="text-xs text-white/70">Votre solde disponible</p>
                    </div>

                    <div className="text-center">
                      <p className="text-4xl font-bold">2 500</p>
                      <p className="text-sm text-white/60">TND</p>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-[#111827]/10 backdrop-blur-sm rounded-2xl p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">💻</span>
                            <div>
                              <p className="text-sm font-medium">TechnoStore</p>
                              <p className="text-xs text-white/60">3x sans frais</p>
                            </div>
                          </div>
                          <p className="text-sm font-bold">-450 TND</p>
                        </div>
                      </div>
                      <div className="bg-[#111827]/10 backdrop-blur-sm rounded-2xl p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">👗</span>
                            <div>
                              <p className="text-sm font-medium">ModaChic</p>
                              <p className="text-xs text-white/60">6x mensualités</p>
                            </div>
                          </div>
                          <p className="text-sm font-bold">-280 TND</p>
                        </div>
                      </div>
                      <div className="bg-[#111827]/10 backdrop-blur-sm rounded-2xl p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🏋️</span>
                            <div>
                              <p className="text-sm font-medium">FitnessPro</p>
                              <p className="text-xs text-white/60">3x sans frais</p>
                            </div>
                          </div>
                          <p className="text-sm font-bold">-180 TND</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -left-16 top-24 glass-card p-4 animate-slide-in-left shadow-xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                      <span className="text-indigo-400 font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Approuvé !</p>
                    <p className="text-xs text-gray-500">3x 150 TND/mois</p>
                  </div>
                </div>
              </div>

              <div className="absolute -right-12 bottom-32 glass-card p-4 animate-slide-in-right shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                    <span className="text-lg">🏪</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">+100 Boutiques</p>
                    <p className="text-xs text-gray-500">Partenaires actifs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
