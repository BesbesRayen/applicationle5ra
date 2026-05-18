'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Smartphone, RefreshCw, ExternalLink, Download } from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const QR_EXPIRY_SECONDS = 120;
const EXPO_SLUG = 'credittn';          // matches app.json "slug"
const CUSTOM_SCHEME = 'creditn';       // matches app.json "scheme"
const APP_STORE_URL = 'https://apps.apple.com/app/credittn/id000000000';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=tn.credittn.app';

/**
 * Build the best scannable URL for a given action.
 *
 * Priority:
 * 1. If it's already an https URL — use as-is.
 * 2. If it's a creditn:// deep link — keep as-is (registered scheme, works on Android/iOS).
 * 3. Otherwise — encode as Expo universal link so Expo Go can open it on the correct screen.
 *
 * Note: Custom schemes (creditn://) are directly scannable by the native camera on Android.
 * On iOS the native camera also handles registered schemes. Expo Go also opens exp:// links.
 */
function buildScanUrl(rawLink: string): string {
  // Already a full URL
  if (rawLink.startsWith('https://') || rawLink.startsWith('http://')) return rawLink;

  // Already a custom scheme our app handles
  if (rawLink.startsWith(`${CUSTOM_SCHEME}://`)) return rawLink;

  // Bare action like "kyc/start" or "payment/pay/3" → wrap in custom scheme
  return `${CUSTOM_SCHEME}://${rawLink}`;
}

/**
 * Expo Go URL for developers/testers (LAN dev server).
 * Reads NEXT_PUBLIC_EXPO_HOST from env — set to your machine IP when developing.
 */
function buildExpoDevUrl(rawLink: string): string | null {
  const host = process.env.NEXT_PUBLIC_EXPO_HOST;
  if (!host) return null;
  const path = rawLink.replace(`${CUSTOM_SCHEME}://`, '');
  return `exp://${host}:8081/--/${path}`;
}

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  deepLink: string;
  productName?: string;
}

export default function QRModal({ isOpen, onClose, deepLink, productName }: QRModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [secondsLeft, setSecondsLeft] = useState(QR_EXPIRY_SECONDS);
  const [expired, setExpired] = useState(false);

  const scanUrl = buildScanUrl(deepLink);
  const expoDevUrl = buildExpoDevUrl(deepLink);
  // Prefer Expo dev URL in dev, custom scheme in prod
  const activeUrl = expoDevUrl ?? scanUrl;

  const generateQR = useCallback(async (url: string) => {
    try {
      const QRCode = (await import('qrcode')).default;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 240,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(dataUrl);
    } catch {
      setQrDataUrl('');
    }
  }, []);

  // Reset + generate whenever the modal opens or the link changes
  useEffect(() => {
    if (!isOpen) return;
    setExpired(false);
    setSecondsLeft(QR_EXPIRY_SECONDS);
    setQrDataUrl('');
    generateQR(activeUrl);
  }, [isOpen, activeUrl, generateQR]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || expired) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { setExpired(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isOpen, expired]);

  const handleRefresh = () => {
    setExpired(false);
    setSecondsLeft(QR_EXPIRY_SECONDS);
    setQrDataUrl('');
    generateQR(activeUrl);
  };

  const progress = (secondsLeft / QR_EXPIRY_SECONDS) * 100;
  const progressColor = secondsLeft > 60 ? '#6366f1' : secondsLeft > 30 ? '#f59e0b' : '#ef4444';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative z-10 w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors z-10"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="pt-6 sm:pt-8 pb-4 px-6 sm:px-8 text-center">
          <div className="w-14 h-14 mx-auto bg-indigo-50 rounded-3xl flex items-center justify-center mb-4">
            <Smartphone className="w-7 h-7 text-indigo-600" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-1">
            {productName ? productName : "Ouvrir dans l'app"}
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Scannez avec l&apos;appareil photo de votre t&eacute;l&eacute;phone
          </p>
        </div>

        {/* QR area */}
        <div className="px-6 sm:px-8 pb-4">
          <div
            className="flex items-center justify-center bg-gray-50 border border-gray-100 rounded-3xl p-4"
            style={{ minHeight: 240 }}
          >
            {expired ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <RefreshCw className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-500">QR expir&eacute;</p>
                <button
                  onClick={handleRefresh}
                  className="px-5 py-2 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 transition-colors"
                >
                  R&eacute;g&eacute;n&eacute;rer
                </button>
              </div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR CreditTN`}
                width={220}
                height={220}
                className="rounded-2xl"
              />
            ) : (
              <div className="w-[220px] h-[220px] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {!expired && (
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs text-gray-400 font-medium">
                <span>En attente du scan&hellip;</span>
                <span className="tabular-nums" style={{ color: progressColor }}>
                  {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:
                  {String(secondsLeft % 60).padStart(2, '0')}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%`, backgroundColor: progressColor }}
                />
              </div>
            </div>
          )}

          {/* Direct open link for desktop browsers */}
          <a
            href={activeUrl}
            className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-2xl transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ouvrir le lien directement
          </a>
        </div>

        {/* Divider + store buttons */}
        <div className="mx-6 sm:mx-8 border-t border-gray-100 my-1" />
        <div className="px-6 sm:px-8 pb-6 pt-3 space-y-2">
          <p className="text-xs text-gray-400 text-center font-medium mb-3">
            App non install&eacute;e ? T&eacute;l&eacute;chargez-la gratuitement
          </p>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-3 bg-gray-900 text-white text-xs font-bold rounded-2xl hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              App Store
            </a>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-3 bg-gray-900 text-white text-xs font-bold rounded-2xl hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
              </svg>
              Google Play
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
