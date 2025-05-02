// src/hooks/useI18n.js
import { useState, useEffect } from 'react';

export function useI18n() {
  const [currentPath, setCurrentPath] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    setCurrentPath(window.location.pathname);
    setIsInitialized(true);
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
  
  // Generar URL para un idioma específico
  const getLanguageUrl = (lang) => {
    if (lang === 'es') {
      return basePath;
    } else {
      return `/en${basePath === '/' ? '' : basePath}`;
    }
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
    getLanguageUrl,
    changeLanguage,
    translatePath
  };
} 