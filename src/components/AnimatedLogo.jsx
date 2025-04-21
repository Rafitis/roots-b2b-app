import React, { useState, useEffect } from 'react';

export default function AnimatedLogo() {
  const [scrollY, setScrollY] = useState(0);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    const onResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    // Escuchar tanto scroll como cambios de tamaño de ventana
    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);
    
    // Inicialización
    onResize();
    
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Configuración de la animación adaptable
  const maxScroll = windowSize.height * 0.5; // Más adaptable que un valor fijo
  const progress = Math.min(scrollY / maxScroll, 1);
  
  // Valores de escala
  const startScale = 1;
  const endScale = windowSize.width < 1024 ? 0.3 : 0.25; // Escala adaptativa según tamaño
  const scale = startScale - (startScale - endScale) * progress;
  
  // Posición final adaptativa
  const headerHeight = 90; // Altura de tu header
  const startPosition = windowSize.height * 0.2; // 20% de la altura de la ventana
  const endPosition = headerHeight / 2; // Centrado en el header
  
  const translateY = startPosition - (startPosition - endPosition) * progress;
  
  // Aplicar estilos solo en pantallas medianas o superiores
  const isMobile = windowSize.width < 768;
  const animationStyle = isMobile 
    ? { transform: "translateY(-50%)" } 
    : { 
        transform: `translateY(calc(-50% + ${translateY}px)) scale(${scale})`,
        transition: 'transform 0.1s ease-out'
      };

  return (
    <div 
      className={`absolute md:fixed inset-x-0 ${isMobile ? 'top-[20vh]' : ''} flex justify-center pointer-events-none md:z-[60]`}
      style={isMobile ? {} : { top: 0}}
    >
      <img 
        src="/B2B_RootsBarefoot.png" 
        alt="Roots Barefoot" 
        className="transform transition-transform ease-out md:motion-reduce:transform-none"
        style={animationStyle} 
      />
    </div>
  );
}