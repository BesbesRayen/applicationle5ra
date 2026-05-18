'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FAQ } from '@/data/faq';

interface FAQAccordionProps {
  faqs: FAQ[];
}

export default function FAQAccordion({ faqs }: FAQAccordionProps) {
  const [openId, setOpenId] = useState<number | null>(null);

  const toggle = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="space-y-3">
      {faqs.map((faq) => (
        <div
          key={faq.id}
          className={`rounded-2xl border transition-all duration-300 ${
            openId === faq.id
              ? 'border-indigo-500/30 bg-indigo-500/5 shadow-md shadow-indigo-500/5'
              : 'border-white/5 bg-[#111827] hover:border-white/10'
          }`}
        >
          <button
            onClick={() => toggle(faq.id)}
            className="w-full flex items-center justify-between gap-4 p-5 text-left"
          >
            <span
              className={`font-semibold transition-colors ${
                openId === faq.id ? 'text-indigo-400' : 'text-white'
              }`}
            >
              {faq.question}
            </span>
            <ChevronDown
              className={`w-5 h-5 shrink-0 transition-all duration-300 ${
                openId === faq.id
                  ? 'rotate-180 text-primary-500'
                  : 'text-gray-400'
              }`}
            />
          </button>
          {openId === faq.id && (
            <div className="px-5 pb-5 animate-fade-in">
              <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
