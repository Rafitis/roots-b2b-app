import React, { useState, useEffect } from 'react';
import { ShoppingCart, LogOut, BarChart3, Package } from 'lucide-react';
import { useStore } from '@nanostores/react'
import { cartCountStore } from '@hooks/useCart'

import {LanguagePicker} from '@components/LanguagePicker.jsx';
import { useTranslations } from '@i18n/utils';
import { useI18n } from '@hooks/useI18n';

/**
 * Header component for the B2B e-commerce site.
 * Compact, professional header with warm brand colors.
 */
export default function Header() {
  const { currentLang } = useI18n();
  const t = useTranslations(currentLang);

  const cartCount = useStore(cartCountStore)
  const [isScrolled, setIsScrolled] = useState(false);

  const isAdmin = typeof window !== 'undefined'
    ? window.__ROOTS_INITIAL_STATE__?.isAdmin || false
    : false;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'GET' });
      window.location.href = '/signin';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const productsUrl = currentLang === 'en' ? '/en/main-view' : '/main-view';
  const cartUrl = currentLang === 'en' ? '/en/carrito' : '/carrito';
  const invoicesUrl = currentLang === 'en' ? '/en/admin/invoices' : '/admin/invoices';
  const adminProductsUrl = currentLang === 'en' ? '/en/admin/products' : '/admin/products';

  return (
    <header
      className={[
        'fixed top-0 w-full z-50 transition-all duration-200 ease-out',
        'px-6 lg:px-10',
        isScrolled
          ? 'h-16 bg-base-100/95 backdrop-blur-sm shadow-soft'
          : 'h-20 bg-base-100',
      ].join(' ')}
    >
      <div className="h-full max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <a href={productsUrl} className="flex items-center gap-3 group">
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-wide uppercase text-roots-bark leading-none">
              Roots Barefoot
            </span>
            <span className="text-[10px] font-medium tracking-widest uppercase text-roots-clay leading-none mt-0.5">
              B2B Portal
            </span>
          </div>
        </a>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {isAdmin && (
            <>
              <a
                href={invoicesUrl}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-roots-earth hover:text-roots-bark hover:bg-base-200 transition-colors"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden md:inline">{t('nav.invoices') || 'Facturas'}</span>
              </a>
              <a
                href={adminProductsUrl}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-roots-earth hover:text-roots-bark hover:bg-base-200 transition-colors"
              >
                <Package className="h-4 w-4" />
                <span className="hidden md:inline">{t('nav.management') || 'Gestionar'}</span>
              </a>
              <div className="w-px h-5 bg-base-300 mx-1" />
            </>
          )}

          <a
            href={productsUrl}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-roots-earth hover:text-roots-bark hover:bg-base-200 transition-colors"
          >
            {t('nav.products')}
          </a>

          <a
            href={cartUrl}
            className="relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-roots-earth hover:text-roots-bark hover:bg-base-200 transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden md:inline">{t('nav.cart')}</span>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 left-6 md:relative md:top-0 md:left-0 min-w-[18px] h-[18px] flex items-center justify-center bg-roots-bark text-roots-sand text-[10px] font-bold rounded-full px-1">
                {cartCount}
              </span>
            )}
          </a>

          <div className="w-px h-5 bg-base-300 mx-1" />

          <LanguagePicker />

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-roots-earth hover:text-roots-bark hover:bg-base-200 transition-colors"
            aria-label="Cerrar sesión"
            title={t('nav.logout')}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </header>
  );
}
