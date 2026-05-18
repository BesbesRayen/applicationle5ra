import Link from 'next/link';
import { CreditCard, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-dark-800 text-gray-300">
      {/* Main Footer */}
      <div className="container-custom mx-auto section-padding !py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-white">
                Credit<span className="text-primary-400">TN</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              La première plateforme tunisienne de paiement échelonné. Achetez
              maintenant, payez plus tard en toute sécurité.
            </p>
            <div className="flex gap-3 pt-2">
              {['facebook', 'instagram', 'linkedin', 'twitter'].map((social) => (
                <a
                  key={social}
                  href={`https://${social}.com/credittn`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-dark-700 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition-all duration-200"
                  aria-label={social}
                >
                  <span className="text-xs font-bold uppercase">{social[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Liens Rapides</h4>
            <ul className="space-y-3">
              {[
                { href: '/', label: 'Accueil' },
                { href: '/boutiques', label: 'Boutiques Partenaires' },
                { href: '/support', label: 'Centre d\'Aide' },
                { href: '/login', label: 'Se Connecter' },
                { href: '/register', label: 'Créer un Compte' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4">Nos Services</h4>
            <ul className="space-y-3">
              {[
                'Paiement en 3x',
                'Paiement en 6x',
                'Paiement en 12x',
                'Partenariat Boutiques',
                'Application Mobile',
              ].map((service) => (
                <li key={service}>
                  <span className="text-sm text-gray-400">{service}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary-400 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-400">
                  7ay el karma sa7bi
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary-400 shrink-0" />
                <a
                  href="tel:+21671000000"
                  className="text-sm text-gray-400 hover:text-primary-400 transition-colors"
                >
                  +216 97979797
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary-400 shrink-0" />
                <a
                  href="mailto:contact@credittn.tn"
                  className="text-sm text-gray-400 hover:text-primary-400 transition-colors"
                >
                  adminbnbl@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700/50">
        <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} CreditTN. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Politique de confidentialité
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Conditions d&apos;utilisation
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Mentions légales
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
