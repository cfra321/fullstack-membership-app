/**
 * Footer Component
 *
 * Site footer with copyright and links.
 */

import Link from 'next/link';

import { cn } from '../../lib/utils';

/**
 * Footer props.
 */
export interface FooterProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Footer link item.
 */
interface FooterLink {
  href: string;
  label: string;
}

/**
 * Footer navigation links.
 */
const footerLinks: FooterLink[] = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/contact', label: 'Contact' },
];

/**
 * Footer Component
 *
 * @example
 * <Footer />
 */
export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className={cn(
        'bg-gray-50 border-t border-gray-200',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Copyright */}
          <div className="text-sm text-gray-500">
            &copy; {currentYear} Astronacci. All rights reserved.
          </div>

          {/* Links */}
          <nav className="flex items-center space-x-6">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
