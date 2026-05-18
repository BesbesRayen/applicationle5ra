'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  CreditCard, Wallet, CalendarClock, Bell, ShoppingBag,
  Shield, Zap, ChevronRight, RefreshCw, Smartphone,
  CheckCircle, Clock, AlertCircle, Trophy, Lock,
  Star, Sparkles, Activity, QrCode,
} from 'lucide-react';
import QRModal from '@/components/QRModal';
import { useSocket } from '@/lib/useSocket';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8082';
const POLL_INTERVAL = 30_000;

// ── Types ──────────────────────────────────────────────────────────────────────
interface UserProfile {
  userId?: number;
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  creditScore?: number;
  walletBalance?: number;
  creditLimit?: number;
  availableCredit?: number;
  kycStatus?: string;
  financialScore?: number;
}
interface CreditInfo {
  id: number;
  productName: string;
  totalAmount: number;
  status: string;
  monthlyInstallment?: number;
  numberOfInstallments?: number;
  duration?: number;
  createdAt: string;
}
interface Installment {
  id: number;
  dueDate: string;
  amount: number;
  status: string;
  creditId?: number;
  creditRequestId?: number;
  productName?: string;
}
interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function scoreLevel(s: number) {
  if (s >= 750) return { label: 'Excellent', tier: 'Platinum', color: '#8b5cf6', badge: 'badge-purple' };
  if (s >= 650) return { label: 'Bon',       tier: 'Gold',     color: '#f59e0b', badge: 'badge-amber' };
  if (s >= 550) return { label: 'Moyen',     tier: 'Silver',   color: '#6366f1', badge: 'badge-blue' };
  return             { label: 'Faible',      tier: 'Bronze',   color: '#f97316', badge: 'badge-red' };
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function ScoreRing({ score, verified }: { score: number; verified: boolean }) {
  const max = 850;
  const r = 56;
  const circ = 2 * Math.PI * r;
  const offset = verified ? circ * (1 - Math.min(score / max, 1)) : circ;
  const lvl = scoreLevel(score);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
          <circle
            cx="64" cy="64" r={r} fill="none"
            stroke={verified ? lvl.color : '#334155'} strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {verified ? (
            <>
              <span className="text-3xl font-black text-white">{score}</span>
              <span className="text-[11px] text-gray-500 font-semibold">/ {max}</span>
            </>
          ) : (
            <Lock className="w-8 h-8 text-gray-600" />
          )}
        </div>
      </div>
      {verified ? (
        <span className={`${lvl.badge} text-xs font-black`}>{lvl.tier} &middot; {lvl.label}</span>
      ) : (
        <span className="badge-amber text-xs font-bold">Verification requise</span>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[#111827] rounded-3xl border border-white/10 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="shimmer-dark w-10 h-10 rounded-2xl" />
        <div className="shimmer-dark w-16 h-4 rounded-full" />
      </div>
      <div className="shimmer-dark w-24 h-7 rounded-xl" />
      <div className="shimmer-dark w-32 h-4 rounded-full" />
    </div>
  );
}

function VerificationBanner({
  kycStatus,
  onVerify,
}: {
  kycStatus: string;
  onVerify: () => void;
}) {
  if (kycStatus === 'APPROVED') return null;
  const isPending = kycStatus === 'PENDING';
  return (
    <div className={`rounded-3xl p-5 border ${isPending ? 'bg-amber-500/10 border-amber-500/20' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isPending ? 'bg-amber-500/20' : 'bg-indigo-500/20'}`}>
          {isPending ? <Clock className="w-6 h-6 text-amber-400" /> : <Shield className="w-6 h-6 text-indigo-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-black ${isPending ? 'text-amber-300' : 'text-indigo-200'}`}>
            {isPending ? 'Verification en cours...' : "Verification d'identite requise"}
          </p>
          <p className={`text-xs mt-0.5 leading-relaxed ${isPending ? 'text-amber-400/80' : 'text-indigo-300/80'}`}>
            {isPending
              ? 'Votre dossier KYC est en cours de revision. Nous vous notifierons des validation.'
              : 'Completez votre verification pour debloquer votre limite de credit.'}
          </p>
          <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${isPending ? 'w-2/3 bg-amber-400' : 'w-1/3 bg-indigo-400'}`} />
          </div>
          <p className={`text-[10px] mt-1 font-semibold ${isPending ? 'text-amber-500' : 'text-indigo-400'}`}>
            {isPending ? 'Etape 2/3 — En revision' : 'Etape 1/3 — Documents requis'}
          </p>
        </div>
        {!isPending && (
          <button
            onClick={onVerify}
            className="flex-shrink-0 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Verifier
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [credits, setCredits] = useState<CreditInfo[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [qrModal, setQrModal] = useState({ open: false, link: '', name: '' });
  const [renderTime] = useState(() => Date.now());
  const tokenRef = useRef<string | null>(null);

  const openAppQR = (action: string, name = '') => {
    setQrModal({ open: true, link: `creditn://${action}`, name });
  };

  const fetchUserData = useCallback(async (token: string) => {
    // Resolve userId from stored user object
    let userId: number | null = null;
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        userId = u.userId ?? u.id ?? null;
      }
    } catch { /* ignore */ }

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const uidParam = userId ? `?userId=${userId}` : '';
    const [userRes, dashRes, creditsRes, installRes, notifRes, walletRes] = await Promise.allSettled([
      fetch(`${API_BASE}/api/users/profile${uidParam}`, { headers }),
      fetch(`${API_BASE}/api/dashboard${uidParam}`, { headers }),
      fetch(`${API_BASE}/api/credits/my${uidParam}`, { headers }),
      fetch(`${API_BASE}/api/credits/my-installments${uidParam}`, { headers }),
      fetch(`${API_BASE}/api/notifications${uidParam}`, { headers }),
      fetch(`${API_BASE}/api/payments/wallet-balance${uidParam}`, { headers }),
    ]);

    // If all calls return 401, token is stale — force re-login
    const allUnauthorized = [userRes, dashRes, creditsRes, installRes, notifRes, walletRes].every(
      (r) => r.status === 'fulfilled' && r.value.status === 401,
    );
    if (allUnauthorized) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return;
    }

    // User profile (provides id, firstName, lastName, email, kycStatus)
    if (userRes.status === 'fulfilled' && userRes.value.ok) {
      const data = await userRes.value.json();
      // Backend UserDto uses field "id" — remap to both for compatibility
      setUser((prev) => ({ ...prev, ...data, userId: data.id ?? prev?.userId, id: data.id }));
    }

    // Dashboard summary (provides creditScore, totalLimit, availableCredit, kycStatus)
    if (dashRes.status === 'fulfilled' && dashRes.value.ok) {
      const data = await dashRes.value.json();
      setUser((prev) => prev ? {
        ...prev,
        creditScore: data.creditScore ?? prev.creditScore,
        creditLimit: data.totalLimit ?? prev.creditLimit,
        availableCredit: data.availableCredit ?? prev.availableCredit,
      } : prev);
    }

    if (walletRes.status === 'fulfilled' && walletRes.value.ok) {
      const data = await walletRes.value.json();
      setUser((prev) => prev ? { ...prev, walletBalance: data.balance ?? prev.walletBalance } : prev);
    }

    // Credits/purchases — map monthlyAmount → monthlyInstallment
    if (creditsRes.status === 'fulfilled' && creditsRes.value.ok) {
      const data = await creditsRes.value.json();
      const list = (Array.isArray(data) ? data : (data.content ?? [])).map((c: Record<string, unknown>) => ({
        ...c,
        monthlyInstallment: c.monthlyInstallment ?? c.monthlyAmount,
        duration: c.duration ?? c.numberOfInstallments,
        status: String(c.status),
      }));
      setCredits(list);
    }

    // Installments
    if (installRes.status === 'fulfilled' && installRes.value.ok) {
      const data = await installRes.value.json();
      const list = (Array.isArray(data) ? data : (data.content ?? [])).map((i: Record<string, unknown>) => ({
        ...i,
        status: String(i.status),
        creditId: i.creditId ?? i.creditRequestId,
      }));
      setInstallments(list);
    }

    // Notifications
    if (notifRes.status === 'fulfilled' && notifRes.value.ok) {
      const data = await notifRes.value.json();
      const list = Array.isArray(data) ? data : (data.content ?? []);
      setNotifications(list);
    }
    setLastSync(new Date());
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (!storedUser || !storedToken) { window.location.href = '/login'; return; }
    // Validate JWT format (header.payload.signature) — reject fake/legacy tokens immediately
    const isValidJwt = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(storedToken);
    if (!isValidJwt) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return;
    }
    try {
      setUser(JSON.parse(storedUser));
      tokenRef.current = storedToken;
    } catch { window.location.href = '/login'; return; }
    fetchUserData(storedToken).finally(() => setLoading(false));
  }, [fetchUserData]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!tokenRef.current) return;
      setSyncing(true);
      fetchUserData(tokenRef.current).finally(() => setSyncing(false));
    }, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchUserData]);

  // Real-time sync via Socket.IO (supplements 30s polling)
  const { connected: socketConnected, lastEvent } = useSocket(user?.userId ?? user?.id);
  useEffect(() => {
    if (!lastEvent || !tokenRef.current) return;
    // Refresh data on any user-scoped real-time event
    setSyncing(true);
    fetchUserData(tokenRef.current).finally(() => setSyncing(false));
  }, [lastEvent, fetchUserData]);

  const manualSync = () => {
    if (!tokenRef.current || syncing) return;
    setSyncing(true);
    fetchUserData(tokenRef.current).finally(() => setSyncing(false));
  };

  const verified = user?.kycStatus === 'APPROVED';
  const score = verified ? (user?.creditScore ?? 0) : 0;
  const walletBalance = verified ? (user?.walletBalance ?? 0) : null;
  const creditLimit = verified ? (user?.availableCredit ?? 0) : null;
  const activeCredits = credits.filter((c) => ['APPROVED', 'ACTIVE', 'PENDING'].includes(c.status));
  const pendingInst = installments
    .filter((i) => i.status === 'PENDING')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const unread = notifications.filter((n) => !n.read).length;
  const nextDue = pendingInst[0];
  const lvl = scoreLevel(score);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] pt-16">
        <div className="h-36 bg-gradient-to-r from-indigo-600 to-purple-700 shimmer-dark" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="shimmer-dark h-80 rounded-3xl" />
            <div className="lg:col-span-2 shimmer-dark h-80 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] pt-16">
      {/* Hero strip */}
      <div className={`bg-gradient-to-r ${verified ? 'from-indigo-600 via-violet-600 to-purple-700' : 'from-slate-700 via-slate-800 to-slate-900'} text-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="animate-slide-up">
              <p className="text-indigo-200 text-sm font-semibold">Bonjour</p>
              <h1 className="text-2xl sm:text-3xl font-black mt-0.5 tracking-tight">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-indigo-200/80 text-xs mt-1">{user?.email}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={manualSync}
                disabled={syncing}
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-semibold transition-colors ${syncing ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <Activity className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sync...' : lastSync ? `Sync ${lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : 'Sync'}
              </button>
              {unread > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-2xl text-xs font-bold">
                  <Bell className="w-3.5 h-3.5" />
                  {unread} nouvelle{unread > 1 ? 's' : ''}
                </div>
              )}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold ${socketConnected ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/10 text-white/60'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-white/40'}`} />
                {socketConnected ? 'Live' : 'Offline'}
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold ${verified ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-200'}`}>
                {verified ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                KYC: {verified ? 'Verifie' : user?.kycStatus === 'PENDING' ? 'En attente' : 'Requis'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
        <VerificationBanner
          kycStatus={user?.kycStatus ?? 'NONE'}
          onVerify={() => openAppQR('kyc/start', "Verification d'identite")}
        />

        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          {[
            { label: 'Solde portefeuille', value: walletBalance !== null ? `${walletBalance.toLocaleString('fr-TN')} TND` : '—', icon: Wallet,       color: 'text-indigo-400', bg: 'bg-indigo-500/10', locked: !verified },
            { label: 'Credit disponible',  value: creditLimit   !== null ? `${creditLimit.toLocaleString('fr-TN')} TND`   : '—', icon: CreditCard,   color: 'text-violet-400', bg: 'bg-violet-500/10', locked: !verified },
            { label: 'Achats actifs',      value: verified ? String(activeCredits.length) : '—',                                  icon: ShoppingBag,  color: 'text-emerald-400',bg: 'bg-emerald-500/10',locked: false },
            { label: 'Prochaine echeance', value: nextDue ? new Date(nextDue.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Aucune', icon: CalendarClock, color: nextDue ? 'text-amber-400' : 'text-gray-500', bg: nextDue ? 'bg-amber-500/10' : 'bg-white/5', locked: false },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#111827] rounded-3xl border border-white/10 p-5 card-hover animate-fadeIn">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${stat.bg} rounded-2xl flex items-center justify-center`}>
                  {stat.locked ? <Lock className="w-5 h-5 text-gray-600" /> : <stat.icon className={`w-5 h-5 ${stat.color}`} />}
                </div>
                {stat.locked && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Verrouille</span>}
              </div>
              <p className={`text-xl font-black stat-number ${stat.locked ? 'text-gray-600' : 'text-white'}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Credit Score card */}
          <div className="bg-[#111827] rounded-3xl border border-white/10 p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-black text-white">Score Credit</h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {verified ? 'Mis a jour en temps reel' : 'Verification requise'}
                </p>
              </div>
              <button onClick={manualSync} className="p-2 rounded-2xl hover:bg-white/5 text-gray-600 hover:text-indigo-400 transition-colors">
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <ScoreRing score={score} verified={verified} />
            </div>

            {verified ? (
              <>
                <div className="mt-6 space-y-3">
                  {[  
                    { label: 'Fiabilite paiements', pct: Math.min(90, 50 + (score - 300) / 5) },
                    { label: 'Utilisation credit',  pct: Math.min(85, 40 + (score - 300) / 6) },
                    { label: 'Historique',           pct: Math.min(80, 35 + (score - 300) / 7) },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-gray-500">{item.label}</span>
                        <span className="text-gray-300">{Math.round(item.pct)}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ width: `${item.pct}%`, background: `linear-gradient(to right, ${lvl.color}99, ${lvl.color})` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-indigo-300 font-medium leading-relaxed">
                      {score >= 750
                        ? 'Excellent profil ! Continuez a payer a temps pour maintenir votre score.'
                        : score >= 650
                        ? 'Payez 2 mensualites a temps pour atteindre le niveau Platinum.'
                        : 'Reduisez votre utilisation de credit pour ameliorer votre score.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => openAppQR('score/details', 'Details du score')}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-white/5 text-gray-300 text-sm font-bold rounded-2xl hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors"
                >
                  <Trophy className="w-4 h-4" />
                  Ameliorer mon score
                </button>
              </>
            ) : (
              <div className="mt-6 space-y-3">
              <p className="text-xs text-center text-gray-500 leading-relaxed">
                  Votre score credit sera revele apres validation de votre identite.
                </p>
                <button
                  onClick={() => openAppQR('kyc/start', 'Verification KYC')}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Debloquer mon score
                </button>
              </div>
            )}
          </div>

          {/* Active purchases + installments */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-[#111827] rounded-3xl border border-white/10 p-6 animate-fadeIn">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-black text-white">Mes Achats BNPL</h2>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">Buy Now Pay Later — actifs</p>
                </div>
                <Link href="/boutiques" className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                  Explorer <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {activeCredits.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="w-14 h-14 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-3">
                    <ShoppingBag className="w-7 h-7 text-indigo-500" />
                  </div>
                  <p className="text-sm font-bold text-gray-300">Aucun achat en cours</p>
                  <p className="text-xs text-gray-500 mt-1">Decouvrez nos boutiques partenaires</p>
                  <Link href="/boutiques" className="mt-4 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 transition-colors">
                    Decouvrir
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeCredits.slice(0, 4).map((credit) => {
                    const months = credit.numberOfInstallments ?? credit.duration ?? 3;
                    const isFree = months <= 3;
                    return (
                      <div key={credit.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-indigo-500/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#1a2133] rounded-2xl flex items-center justify-center border border-white/10">
                            <ShoppingBag className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white truncate max-w-[150px]">{credit.productName}</p>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${isFree ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                              {isFree ? <Zap className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                              {months} mois {isFree ? 'sans frais' : '+ interets'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-white stat-number">{credit.totalAmount?.toLocaleString('fr-TN')} TND</p>
                          {credit.monthlyInstallment && (
                            <p className="text-[10px] text-gray-500 stat-number">{credit.monthlyInstallment.toLocaleString('fr-TN')} TND/mois</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {pendingInst.length > 0 && (
              <div className="bg-[#111827] rounded-3xl border border-white/10 p-6 animate-fadeIn">
                <h3 className="text-base font-black text-white mb-4">Prochaines Echeances</h3>
                <div className="space-y-2.5">
                  {pendingInst.slice(0, 4).map((inst) => {
                    const due = new Date(inst.dueDate);
                    const daysLeft = Math.ceil((due.getTime() - renderTime) / 86400000);
                    const isOverdue = daysLeft < 0;
                    return (
                      <div key={inst.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${isOverdue ? 'bg-red-500/20' : daysLeft <= 3 ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
                            {isOverdue ? <AlertCircle className="w-5 h-5 text-red-400" /> : daysLeft <= 3 ? <Clock className="w-5 h-5 text-amber-400" /> : <CheckCircle className="w-5 h-5 text-emerald-400" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white truncate max-w-[140px]">
                              {inst.productName ?? `Credit #${inst.creditId ?? inst.creditRequestId}`}
                            </p>
                            <p className={`text-xs font-semibold mt-0.5 ${isOverdue ? 'text-red-400' : daysLeft <= 3 ? 'text-amber-400' : 'text-gray-500'}`}>
                              {isOverdue ? `Retard ${-daysLeft}j` : daysLeft === 0 ? "Aujourd'hui" : `Dans ${daysLeft}j`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-black text-white stat-number">{inst.amount.toLocaleString('fr-TN')} TND</p>
                          <button
                            onClick={() => openAppQR(`payment/pay/${inst.id}`, "Payer l'echeance")}
                            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 mt-0.5"
                          >
                            Payer sur l&apos;app
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="bg-[#111827] rounded-3xl border border-white/10 p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-black text-white">Notifications</h2>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300">{unread} non lues</span>
            </div>
            <div className="space-y-2.5">
              {notifications.slice(0, 5).map((notif) => (
                <div key={notif.id} className={`flex items-start gap-3 p-4 rounded-2xl transition-colors ${!notif.read ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-white/5'}`}>
                  <div className={`w-2 h-2 rounded-full mt-2.5 flex-shrink-0 ${!notif.read ? 'bg-indigo-400' : 'bg-gray-600'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{notif.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{notif.message}</p>
                    <p className="text-[10px] text-gray-600 mt-1">
                      {new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payer avec CreditTN */}
        <div className="bg-[#111827] rounded-3xl border border-white/10 p-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-base font-black text-white">Payer avec CreditTN</h2>
              </div>
              <p className="text-xs text-gray-500 ml-10.5">Echelonnez vos achats en toute liberte</p>
            </div>
            <button
              onClick={() => openAppQR('payment/scan', 'Scanner pour payer')}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors flex-shrink-0"
            >
              <QrCode className="w-3.5 h-3.5" />
              Scanner avec l&apos;app
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { months: 3,  label: '3 mois',  rate: 'Gratuit',       sublabel: '0% de frais',     tag: 'Gratuit',    tagClass: 'bg-emerald-500/20 text-emerald-300', cardClass: 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15', valueClass: 'text-emerald-400', recommended: true },
              { months: 6,  label: '6 mois',  rate: '+3% total',     sublabel: 'sur le montant',  tag: 'Populaire',  tagClass: 'bg-indigo-500/20 text-indigo-300',   cardClass: 'bg-white/5 border-white/10 hover:bg-white/10',                   valueClass: 'text-indigo-300',  recommended: false },
              { months: 9,  label: '9 mois',  rate: '+6% total',     sublabel: 'sur le montant',  tag: 'Flex',       tagClass: 'bg-amber-500/20 text-amber-300',     cardClass: 'bg-white/5 border-white/10 hover:bg-white/10',                   valueClass: 'text-amber-300',   recommended: false },
              { months: 12, label: '12 mois', rate: '+12% total',    sublabel: 'sur le montant',  tag: 'Long terme', tagClass: 'bg-violet-500/20 text-violet-300',   cardClass: 'bg-white/5 border-white/10 hover:bg-white/10',                   valueClass: 'text-violet-300',  recommended: false },
            ].map((plan) => (
              <div key={plan.months} className={`relative p-5 rounded-2xl border transition-colors cursor-pointer ${plan.cardClass}`}>
                {plan.recommended && (
                  <div className="absolute -top-2 left-4">
                    <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      Recommande
                    </span>
                  </div>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-3xl font-black text-white">{plan.months}</span>
                    <span className="text-sm text-gray-400 font-semibold ml-1">mois</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${plan.tagClass}`}>
                    {plan.tag}
                  </span>
                </div>
                <p className={`text-sm font-black ${plan.valueClass}`}>{plan.rate}</p>
                <p className="text-xs text-gray-600 mt-1">{plan.sublabel}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-4 text-center">
            Scannez le QR code en caisse avec l&apos;application CreditTN pour payer en plusieurs fois
          </p>
        </div>

        {/* App download CTA */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white overflow-hidden animate-fadeIn">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-4 h-4 text-indigo-200" />
                <span className="text-indigo-200 text-xs font-bold uppercase tracking-wider">Application Mobile</span>
              </div>
              <h3 className="text-xl font-black">Tout gerer depuis l&apos;app</h3>
              <p className="text-indigo-200 text-sm mt-1.5 max-w-md leading-relaxed">
                Paiements, score credit, verification KYC, notifications — tout en temps reel.
              </p>
              <div className="flex items-center gap-3 mt-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="w-4 h-4 text-amber-300 fill-amber-300" />
                ))}
                <span className="text-xs text-indigo-200 font-semibold">4.8 / 5</span>
              </div>
            </div>
            <button
              onClick={() => openAppQR('download', 'Telecharger CreditTN')}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-white text-indigo-700 font-bold rounded-2xl hover:bg-indigo-50 transition-colors flex-shrink-0 shadow-lg text-sm"
            >
              <Smartphone className="w-4 h-4" />
              Scanner pour telecharger
            </button>
          </div>
        </div>
      </div>

      <QRModal
        isOpen={qrModal.open}
        onClose={() => setQrModal({ ...qrModal, open: false })}
        deepLink={qrModal.link}
        productName={qrModal.name}
      />
    </div>
  );
}
