import React, { useState, useEffect } from 'react';

export default function AnimatedLogo() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Configuración de la animación
  const maxScroll = 400;
  const progress = Math.min(scrollY / maxScroll, 1);
  const startScale = 1;
  const endScale = 0.25;
  const scale = startScale - (startScale - endScale) * progress;

  const endOffset = -window.innerHeight / 4 + 70;
  const translateY = endOffset * progress;

  // Solo aplicar los estilos de animación en pantallas md y superiores
  const animationStyle = window.innerWidth >= 768 
    ? { transform: `translateY(calc(-50% + ${translateY}px)) scale(${scale})` }
    : { transform: "translateY(-50%)" };

  return (
    <div className="absolute md:fixed inset-x-0 top-[300px] flex justify-center pointer-events-none md:z-[60]">
      <img
        src="/B2B_RootsBarefoot.png"
        alt="Roots Barefoot"
        className="transform transition-transform ease-out md:motion-reduce:transform-none"
        style={animationStyle}
      />
    </div>
  );
}