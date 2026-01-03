import React, { useRef, useEffect } from 'react';

const SpaceBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const setSize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    setSize();

    const stars = [];
    const numStars = 200;

    const createStar = () => {
        const layer = Math.random();
        let speed, size, color;

        if (layer < 0.5) { 
            speed = Math.random() * 0.5 + 0.2;
            size = Math.random() * 1 + 0.5;
            color = '#555'; 
        } else { 
            speed = Math.random() * 2 + 1;
            size = Math.random() * 2 + 1;
            color = '#fff'; 
        }
        
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size,
            speed,
            color
        };
    };

    for (let i = 0; i < numStars; i++) stars.push(createStar());

    // --- NAVE MÃE ---
    const mothership = {
        x: -600, 
        y: canvas.height / 3, // Um pouco mais centrada verticalmente
        width: 500,
        height: 120,
        speed: 15, // MUDANÇA: Mais rápida (era 0.3)
        active: false,
        lightsBlinkTimer: 0
    };

    const APPEAR_TIME = 150000; // 2 min e 30 seg
    // const APPEAR_TIME = 5000; // Descomenta esta linha se quiseres testar JÁ
    const startTime = Date.now();

    let animationFrameId;

    const render = () => {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const now = Date.now();
        const timeElapsed = now - startTime;

        if (timeElapsed > APPEAR_TIME && !mothership.active && mothership.x < canvas.width) {
            mothership.active = true;
        }

        if (mothership.active) {
            mothership.x += mothership.speed; // Move-se na horizontal (X aumenta)
            
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.moveTo(mothership.x, mothership.y + 40);
            ctx.lineTo(mothership.x + mothership.width * 0.8, mothership.y);
            ctx.lineTo(mothership.x + mothership.width, mothership.y + 60);
            ctx.lineTo(mothership.x + mothership.width * 0.8, mothership.y + 100);
            ctx.lineTo(mothership.x, mothership.y + 60);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#222';
            ctx.lineWidth = 2;
            ctx.stroke();

            mothership.lightsBlinkTimer++;
            if (mothership.lightsBlinkTimer > 60) mothership.lightsBlinkTimer = 0;

            if (mothership.lightsBlinkTimer < 30) {
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(mothership.x + 20, mothership.y + 30, 4, 4);
                ctx.fillRect(mothership.x + 20, mothership.y + 90, 4, 4);
            }
            
            ctx.fillStyle = '#0055ff';
            for(let k=0; k<5; k++) {
                ctx.fillRect(mothership.x + 100 + (k*50), mothership.y + 50, 6, 3);
            }
            
            if (mothership.x > canvas.width + 100) mothership.active = false; 
        }

        stars.forEach(star => {
            ctx.fillStyle = star.color;
            ctx.fillRect(star.x, star.y, star.size, star.size);
            star.y += star.speed;
            if (star.y > canvas.height) {
                star.y = 0;
                star.x = Math.random() * canvas.width;
            }
        });

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

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
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    zIndex: -1, pointerEvents: 'none'
  };

  return <canvas ref={canvasRef} style={canvasStyle} />;
};

export default SpaceBackground;