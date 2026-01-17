import React, { useRef, useEffect } from 'react';

const SpaceBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Configuração inicial do Canvas
    const setSize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    setSize();

    // --- CONFIGURAÇÃO DAS ESTRELAS ---
    const stars = [];
    const numStars = 1500; // Mantivemos a quantidade alta para o efeito "Deep Space"
    
    const createStar = () => {
        const depth = Math.random(); 
        let speed, size, color;

        // Cria camadas de profundidade
        if (depth > 0.9) {
            // Perto (rápidas e brilhantes)
            speed = 1.5; size = 2.5; color = '#ffffff';
        } else if (depth > 0.6) {
            // Meio
            speed = 0.8; size = 1.5; color = '#aaaaaa';
        } else {
            // Longe (lentas e escuras)
            speed = 0.2; size = 1; color = '#555555';
        }

        return { 
            x: Math.random() * canvas.width, 
            y: Math.random() * canvas.height, 
            size, 
            speed, 
            color 
        };
    };

    // Inicializar as estrelas
    for (let i = 0; i < numStars; i++) stars.push(createStar());

    let animationFrameId;

    const render = () => {
        // 1. Limpar o ecrã com preto quase total
        ctx.fillStyle = '#050505'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Desenhar e mover as estrelas
        stars.forEach(star => {
            ctx.fillStyle = star.color;
            ctx.fillRect(star.x, star.y, star.size, star.size);
            
            star.y += star.speed;
            
            // Se a estrela sair do fundo, volta para o topo
            if (star.y > canvas.height) {
                star.y = 0;
                star.x = Math.random() * canvas.width;
            }
        });

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    // Redimensionar se o utilizador mudar o tamanho da janela
    const handleResize = () => {
        setSize();
        stars.length = 0;
        for (let i = 0; i < numStars; i++) stars.push(createStar());
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  const canvasStyle = {
    position: 'fixed', 
    top: 0, 
    left: 0, 
    width: '100vw', 
    height: '100vh',
    zIndex: -1, 
    pointerEvents: 'none'
  };

  return <canvas ref={canvasRef} style={canvasStyle} />;
};

export default SpaceBackground;