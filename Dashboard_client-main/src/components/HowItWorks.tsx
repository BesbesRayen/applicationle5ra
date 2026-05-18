import { Search, CreditCard, CalendarCheck, ShoppingBag } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Choisissez votre boutique',
    description:
      'Parcourez notre réseau de boutiques partenaires et trouvez ce dont vous avez besoin.',
    color: 'from-primary-500 to-primary-600',
  },
  {
    number: '02',
    icon: ShoppingBag,
    title: 'Faites vos achats',
    description:
      'Sélectionnez vos articles et choisissez CreditTN comme mode de paiement lors du checkout.',
    color: 'from-violet-500 to-violet-600',
  },
  {
    number: '03',
    icon: CalendarCheck,
    title: 'Choisissez vos mensualités',
    description:
      'Divisez le montant en 3, 6 ou 12 mensualités selon votre convenance. Approbation instantanée.',
    color: 'from-accent-500 to-accent-600',
  },
  {
    number: '04',
    icon: CreditCard,
    title: 'Payez sereinement',
    description:
      'Les mensualités sont prélevées automatiquement. Suivez vos paiements depuis l\'application.',
    color: 'from-amber-500 to-amber-600',
  },
];

export default function HowItWorks() {
  return (
    <section className="section-padding bg-[#0a0f1c] relative overflow-hidden" id="how-it-works">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="container-custom mx-auto relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#111827] border border-white/5 rounded-full mb-6">
            <span className="text-sm font-medium text-gray-300">Comment ça marche</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
            Simple comme{' '}
            <span className="gradient-text">1, 2, 3, 4</span>
          </h2>
          <p className="text-lg text-gray-400">
            En quelques étapes, commencez à profiter du paiement échelonné CreditTN.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              {/* Connector Line (hidden on last item) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-14 left-[calc(50%+40px)] w-[calc(100%-40px)] h-[2px] bg-gradient-to-r from-white/10 to-transparent" />
              )}

              <div className="text-center space-y-4">
                {/* Icon with number */}
                <div className="relative inline-flex">
                  <div
                    className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300`}
                  >
                    <step.icon className="w-12 h-12 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-[#111827] rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md border border-white/5">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-xl font-display font-bold text-white">
                  {step.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
