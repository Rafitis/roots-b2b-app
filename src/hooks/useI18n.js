// src/hooks/useI18n.js
import { useState, useEffect } from 'react';

// Rutas que tienen versión en inglés (/en/...)
const TRANSLATABLE_ROUTES = ['/main-view', '/carrito'];

export function useI18n() {
  const [currentPath, setCurrentPath] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setCurrentPath(window.location.pathname);
    setIsInitialized(true);

    const updatePath = () => setCurrentPath(window.location.pathname);
    document.addEventListener('astro:after-swap', updatePath);
    return () => document.removeEventListener('astro:after-swap', updatePath);
  }, []);

  // Determinar el idioma actual
  const isEnglishRoute = currentPath.startsWith('/en/') || currentPath === '/en';
  const currentLang = isEnglishRoute ? 'en' : 'es';

  // Obtener la ruta base (sin el prefijo de idioma para inglés)
  let basePath = currentPath;
  if (isEnglishRoute) {
    basePath = currentPath.replace(/^\/en(\/|$)/, '/');
    if (basePath === '') basePath = '/';
  }

  // Comprobar si la ruta actual tiene traducción
  const isTranslatable = TRANSLATABLE_ROUTES.some(
    route => basePath === route || basePath === route + '/'
  );

  // Generar URL para un idioma específico
  const getLanguageUrl = (lang) => {
    if (lang === 'es') {
      return basePath;
    }
    // Solo generar ruta /en/ si existe la página traducida
    if (!isTranslatable) return null;
    return `/en${basePath === '/' ? '' : basePath}`;
  };
  
  // Cambiar el idioma y navegar
  const changeLanguage = (lang) => {
    window.location.href = getLanguageUrl(lang);
  };
  
  // Traducir una ruta según el idioma actual
  const translatePath = (routeKey) => {
    // Aquí puedes implementar la lógica para rutas traducidas
    // Por ejemplo, si tienes un mapeo: { "products": { es: "productos", en: "products" } }
    return routeKey; // Implementa según tus necesidades
  };
  
  return {
    currentLang,
    basePath,
    isInitialized,
    isTranslatable,
    getLanguageUrl,
    changeLanguage,
    translatePath
  };
} 