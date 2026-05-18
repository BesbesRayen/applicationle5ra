import Link from 'next/link';
import { Globe, Zap, ChevronRight } from 'lucide-react';
import { Boutique } from '@/data/boutiques';

interface StoreCardProps {
  boutique: Boutique;
}

export default function StoreCard({ boutique }: StoreCardProps) {
  return (
    <Link href={`/boutiques/${boutique.id}`}>
      <div className="group bg-[#111827] rounded-3xl p-5 border border-white/10 hover:border-indigo-500/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer">
        {/* Logo */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-white/5 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform duration-300 mb-4 border border-white/10">
          {boutique.logo}
        </div>
        {/* Name */}
        <h3 className="text-sm font-bold text-white text-center mb-1 truncate">
          {boutique.name}
        </h3>
        {/* BNPL badge */}
        <div className="flex items-center justify-center gap-1 mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold">
            <Zap className="w-2.5 h-2.5" />
            3× gratuit
          </span>
        </div>
        {/* Website */}
        {boutique.website ? (
          <p className="text-xs text-center text-gray-500 truncate">
            {boutique.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          </p>
        ) : null}
        {/* CTA */}
        <div className="mt-3 flex items-center justify-center gap-1 text-xs font-bold text-indigo-400 group-hover:gap-2 transition-all">
          Découvrir <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  );
}
