import React, { useState, useEffect } from 'react';
import { ShoppingCart, LogOut, BarChart3 } from 'lucide-react';
import { useStore } from '@nanostores/react'
import { cartCountStore } from '@hooks/useCart'

import {LanguagePicker} from '@components/LanguagePicker.jsx';
import { useTranslations } from '@i18n/utils';
import { useI18n } from '@hooks/useI18n';

/**
 * Header component for the e-commerce site.
 * Shows logo, navigation to products, cart icon, and logout button.
 * The logout button calls /api/auth/signout and redirects to /login.
*/
export default function Header({ showLogo }) {
  const { currentLang } = useI18n();
  const t = useTranslations(currentLang);

  const cartCount = useStore(cartCountStore)
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // Check cache first
        const cached = sessionStorage.getItem('isAdmin');
        if (cached !== null) {
          setIsAdmin(cached === 'true');
          return;
        }

        // If not cached, fetch from API
        const response = await fetch('/api/user/is-admin');
        const data = await response.json();
        const adminStatus = data.isAdmin || false;

        // Cache for this session
        sessionStorage.setItem('isAdmin', String(adminStatus));
        setIsAdmin(adminStatus);
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);
  // Handler para cerrar sesión
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'GET' });
      // Redirigir al login
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <header className={`fixed top-0 h-[90px] w-full z-50 px-6 py-4 flex items-center justify-between transition-colors animate-fade-in-up animate-duration-slow ${isScrolled ? 'bg-white shadow-md' : 'bg-[#faf6f4] shadow-none'
      }`}>
      {/* Logo and Home Link */}
      <a href={currentLang === 'en' ? '/en/main-view' : '/main-view'} className="flex items-center">
        <span className="text-lg font-bold text-gray-800 uppercase">Roots Barefoot</span>
      </a>
      {/* Logo */}
      {showLogo ?
        <img
          src="/B2B_RootsBarefoot.png"
          alt="Roots Barefoot Logo"
          className="w-16 h-auto object-cover rounded-2xl items-center mx-auto justify-center flex"
        />
        : null}

      {/* Navigation Links */}
      <nav className="flex items-center space-x-6">
          {isAdmin && (
          <div className="tooltip" data-tip="Admin Dashboard">
            <a
              href={currentLang === 'en' ? '/en/admin/invoices' : '/admin/invoices'}
              className="flex items-center text-gray-700 hover:text-gray-900"
            >
              <BarChart3 className="h-6 w-6" />
            </a>
          </div>
        )}
        <a href={currentLang === 'en' ? '/en/main-view' : '/main-view'} className="text-gray-700 hover:text-gray-900 font-medium">
          {t('nav.products')}
        </a>

        <div className="tooltip" data-tip={t('nav.cart')}>
        <a href={currentLang === 'en' ? '/en/carrito' : '/carrito'} className="relative text-gray-700 hover:text-gray-900">
          <ShoppingCart className="h-6 w-6" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </a>
        </div>

        <LanguagePicker />

        <div className="tooltip" data-tip={t('nav.logout')}>
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-700 hover:text-gray-900"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-6 w-6 mr-1" />
            <span className="font-medium"></span>
          </button>
        </div>
      </nav>
    </header>
  );
}
