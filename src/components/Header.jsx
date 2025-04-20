import React, {useState, useEffect} from 'react';
import { ShoppingCart, LogOut } from 'lucide-react';
import { useStore } from '@nanostores/react'
import { cartCountStore } from '@hooks/useCart'


/**
 * Header component for the e-commerce site.
 * Shows logo, navigation to products, cart icon, and logout button.
 * The logout button calls /api/auth/signout and redirects to /login.
 */
export default function Header({showLogo}) {
    const cartCount = useStore(cartCountStore)
    
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
      const handleScroll = () => setIsScrolled(window.scrollY > 0);
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
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
      <header className={`fixed top-0 h-[90px] w-full z-50 px-6 py-4 flex items-center justify-between transition-colors duration-300 ease-in-out ${
        isScrolled ? 'bg-white shadow-md' : 'bg-[#faf6f4] shadow-none'
      }`}>
        {/* Logo and Home Link */}
        <a href="/main-view" className="flex items-center">
          <span className="text-xl font-bold text-gray-800">Roots Barefoot</span>
        </a> 
        {/* Logo */}
        {showLogo ? 
          <img
          src="/B2B_RootsBarefoot.png"
          alt="Roots Barefoot Logo"
          class="w-16 h-auto object-cover rounded-2xl items-center mx-auto justify-center flex"
          />
         : null}

        {/* Navigation Links */}
        <nav className="flex items-center space-x-6">
          <a href="/main-view" className="text-gray-700 hover:text-gray-900 font-medium">
            Productos
          </a>
  
          <a href="/carrito" className="relative text-gray-700 hover:text-gray-900">
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </a>
  
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-700 hover:text-gray-900"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-6 w-6 mr-1" />
            <span className="font-medium">Salir</span>
          </button>
        </nav>
      </header>
    );
  }
