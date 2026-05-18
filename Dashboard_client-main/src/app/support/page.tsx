'use client';

import { useState, useEffect } from 'react';
import {
  Headphones,
  MessageSquare,
  FileText,
  AlertTriangle,
  HelpCircle,
  Mail,
  Phone,
  MapPin,
  Clock,
} from 'lucide-react';
import FAQAccordion from '@/components/FAQAccordion';
import ContactForm from '@/components/ContactForm';
import { faqs, faqCategories } from '@/data/faq';

interface Message {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

const supportCategories = [
  {
    icon: HelpCircle,
    title: 'Centre d\'aide',
    description: 'Trouvez des réponses rapides à vos questions fréquentes.',
    color: 'bg-indigo-500/10 text-indigo-400',
  },
  {
    icon: Headphones,
    title: 'Assistance technique',
    description: 'Un problème technique ? Notre équipe est là pour vous aider.',
    color: 'bg-violet-500/10 text-violet-400',
  },
  {
    icon: AlertTriangle,
    title: 'Réclamations',
    description: 'Soumettez une réclamation et nous la traiterons rapidement.',
    color: 'bg-amber-500/10 text-amber-400',
  },
  {
    icon: MessageSquare,
    title: 'Chat en direct',
    description: 'Discutez en temps réel avec un conseiller CreditTN.',
    color: 'bg-indigo-500/10 text-indigo-400',
  },
];

export default function SupportPage() {
  const [selectedFAQCategory, setSelectedFAQCategory] = useState('Général');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState('');

  // Fetch messages from database
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/messages');
        const data = await response.json();

        if (data.success) {
          setMessages(data.messages || []);
        } else {
          setMessages([]);
          setMessagesError('');
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessagesError('Impossible de charger les messages');
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const filteredFAQs = faqs.filter(
    (faq) => faq.category === selectedFAQCategory
  );

  return (
    <div className="pt-20">
      {/* Header */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0f1c]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#111827] border border-indigo-500/20 rounded-full mb-6">
              <Headphones className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-indigo-400">Service Client</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
              Comment pouvons-nous{' '}
              <span className="gradient-text">vous aider ?</span>
            </h1>
            <p className="text-lg text-gray-400">
              Notre équipe de support est disponible pour répondre à toutes vos questions
              et résoudre vos problèmes rapidement.
            </p>
          </div>
        </div>
      </section>

      {/* Support Categories */}
      <section className="section-padding !pt-0 -mt-6">
        <div className="container-custom mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {supportCategories.map((cat, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-[#111827] border border-white/5 hover:border-primary-200 hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
              >
                <div
                  className={`w-14 h-14 rounded-2xl ${cat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <cat.icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-display font-bold text-white mb-2">
                  {cat.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">{cat.description}</p>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mb-20">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
                Questions Fréquentes
              </h2>
              <p className="text-lg text-gray-400">
                Retrouvez les réponses aux questions les plus posées par nos utilisateurs.
              </p>
            </div>

            {/* FAQ Category Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {faqCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedFAQCategory(cat)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedFAQCategory === cat
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                      : 'bg-[#111827]/50 text-gray-400 hover:bg-[#1f2937]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* FAQ List */}
            <div className="max-w-3xl mx-auto">
              <FAQAccordion faqs={filteredFAQs} />
            </div>
          </div>

          {/* Contact Section */}
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-display font-bold text-white mb-4">
                  Contactez-nous
                </h2>
                <p className="text-lg text-gray-400">
                  Vous ne trouvez pas la réponse à votre question ? N&apos;hésitez pas à nous
                  contacter directement.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Email</h4>
                    <a
                      href="mailto:support@credittn.tn"
                      className="text-indigo-400 hover:text-indigo-400 transition-colors"
                    >
                      support@credittn.tn
                    </a>
                    <p className="text-sm text-gray-500 mt-1">Réponse sous 24h</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Téléphone</h4>
                    <a
                      href="tel:+21671000000"
                      className="text-indigo-400 hover:text-indigo-400 transition-colors"
                    >
                      +216 71 000 000
                    </a>
                    <p className="text-sm text-gray-500 mt-1">Lun – Ven, 8h – 18h</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Adresse</h4>
                    <p className="text-gray-400">
                      Rue du Lac Biwa, Les Berges du Lac
                      <br />
                      1053 Tunis, Tunisie
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Horaires</h4>
                    <p className="text-gray-400">
                      Lundi – Vendredi : 8h00 – 18h00
                      <br />
                      Samedi : 9h00 – 13h00
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="glass-card p-8 glow">
              <h3 className="text-xl font-display font-bold text-white mb-6">
                Envoyez-nous un message
              </h3>
              <ContactForm />
            </div>
          </div>

          {/* Messages Display Section */}
          <div className="mt-20 pt-20 border-t border-white/5">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
                Messages Reçus
              </h2>
              <p className="text-lg text-gray-400">
                Consultez tous les messages soumis via le formulaire de contact.
              </p>
            </div>

            {messagesLoading ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center gap-2">
                  <div className="w-4 h-4 bg-primary-600 rounded-full animate-bounce" />
                  <div className="w-4 h-4 bg-primary-600 rounded-full animate-bounce delay-100" />
                  <div className="w-4 h-4 bg-primary-600 rounded-full animate-bounce delay-200" />
                </div>
                <p className="text-gray-400 mt-4">Chargement des messages...</p>
              </div>
            ) : messagesError ? (
              <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
                <p className="text-red-700">{messagesError}</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl text-center">
                <p className="text-blue-700">Aucun message pour le moment.</p>
              </div>
            ) : (
              <div className="grid gap-6 max-w-4xl mx-auto">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-6 rounded-2xl bg-[#111827] border border-white/5 hover:border-primary-300 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-display font-bold text-white">
                          {msg.subject}
                        </h4>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <span className="font-medium">De:</span> {msg.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Email:</span>
                            <a href={`mailto:${msg.email}`} className="text-indigo-400 hover:underline">
                              {msg.email}
                            </a>
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            msg.status === 'new'
                              ? 'bg-indigo-500/10 text-indigo-400'
                              : msg.status === 'read'
                              ? 'bg-blue-500/10 text-blue-400'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}
                        >
                          {msg.status === 'new' ? '🔴 Nouveau' : msg.status === 'read' ? '👁️ Lu' : '✅ Répondu'}
                        </span>
                        <p className="text-xs text-gray-500">
                          {new Date(msg.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-[#0a0f1c] rounded-xl border border-white/5">
                      <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
