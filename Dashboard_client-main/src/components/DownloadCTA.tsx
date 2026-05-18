'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Smartphone, Star } from 'lucide-react';

const APP_STORE_URL = 'https://apps.apple.com/app/credittn/id000000000';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.credittn.app';
const APP_DOWNLOAD_LINK = 'https://credittn.app/open/download';

export default function DownloadCTA() {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    import('qrcode').then(({ default: QRCode }) => {
      QRCode.toDataURL(APP_DOWNLOAD_LINK, {
        width: 140,
        margin: 1,
        color: { dark: '#0a0f1c', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      }).then(setQrDataUrl).catch(() => {});
    });
  }, []);
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-primary-950 to-dark-900" />
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle, #3381ff 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-600/10 rounded-full blur-3xl" />

      <div className="container-custom mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#111827]/10 border border-white/10 rounded-full backdrop-blur-sm">
              <Smartphone className="w-4 h-4 text-primary-300" />
              <span className="text-sm font-medium text-primary-200">Application Mobile</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold leading-tight">
              Téléchargez l&apos;application{' '}
              <span className="text-primary-400">CreditTN</span>
            </h2>

            <p className="text-lg text-gray-300 leading-relaxed max-w-lg">
              Gérez vos paiements, découvrez de nouvelles boutiques et restez informé de vos
              échéances — tout depuis votre smartphone.
            </p>

            {/* Ratings */}
            <div className="flex items-center gap-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <span className="text-sm text-gray-400">4.8/5 — Plus de 10 000 avis</span>
            </div>

            {/* Download Buttons */}
            <div className="flex flex-wrap gap-4">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-6 py-4 bg-[#111827] text-dark-900 rounded-xl font-semibold hover:bg-[#111827]/5 transition-colors shadow-lg"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                <div className="text-left">
                  <p className="text-xs text-gray-500">Télécharger sur</p>
                  <p className="text-sm font-bold">App Store</p>
                </div>
              </a>
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-6 py-4 bg-[#111827] text-dark-900 rounded-xl font-semibold hover:bg-[#111827]/5 transition-colors shadow-lg"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
                </svg>
                <div className="text-left">
                  <p className="text-xs text-gray-500">Disponible sur</p>
                  <p className="text-sm font-bold">Google Play</p>
                </div>
              </a>
            </div>
          </div>

          {/* Right - QR + Stats */}
          <div className="flex flex-col gap-6">
            {/* QR Code Card */}
            <div className="flex items-center gap-6 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
              <div className="shrink-0">
                {qrDataUrl ? (
                  <div className="bg-white rounded-xl p-2">
                    <img src={qrDataUrl} alt="QR Code téléchargement app" width={120} height={120} className="rounded-lg" />
                  </div>
                ) : (
                  <div className="w-[136px] h-[136px] bg-white/10 rounded-xl animate-pulse" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs text-primary-300 font-semibold uppercase tracking-wide mb-1">📱 Scanner pour ouvrir</p>
                <p className="text-sm text-white font-medium leading-relaxed">
                  Scannez ce QR code pour télécharger ou ouvrir l&apos;application CreditTN
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '50K+', label: 'Utilisateurs actifs', color: 'from-primary-500/20 to-primary-600/10' },
                { value: '100+', label: 'Boutiques partenaires', color: 'from-accent-500/20 to-accent-600/10' },
                { value: '99.9%', label: 'Taux de satisfaction', color: 'from-amber-500/20 to-amber-600/10' },
                { value: '0 TND', label: 'Frais d\'inscription', color: 'from-violet-500/20 to-violet-600/10' },
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-2xl bg-gradient-to-br ${stat.color} border border-white/5 backdrop-blur-sm text-center`}
                >
                  <p className="text-2xl sm:text-3xl font-display font-bold text-white mb-1">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
