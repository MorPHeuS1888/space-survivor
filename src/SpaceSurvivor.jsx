import React, { useRef, useEffect, useState } from 'react';
import './SpaceSurvivor.css';
import SpaceBackground from './SpaceBackground';

// --- IMPORTAR OS SONS ---
import musicFile from './music.mp3'; 
import shootFile from './shoot.mp3';     // <--- NOVO
import explodeFile from './explode.mp3'; // <--- NOVO

const SpaceSurvivor = () => {
  // --- ESTADOS ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [takeDamageEffect, setTakeDamageEffect] = useState(false);

  const [motionBlur, setMotionBlur] = useState(true);
  const [volume, setVolume] = useState(0.5);

  // Música de fundo (Persistente)
  const bgmRef = useRef(new Audio(musicFile));

  const canvasRef = useRef(null);
  const GAME_WIDTH = 800;
  const GAME_HEIGHT = 600;

  const gameState = useRef({
    playerX: GAME_WIDTH / 2,
    playerY: GAME_HEIGHT - 50,
    projectiles: [],
    enemyProjectiles: [],
    enemies: [],
    lastEnemySpawn: 0,
    spawnRate: 2000, 
    enemiesPerSpawn: 1,
    startTime: 0,
    difficultyLevel: 1,
    currentLives: 5,         
    invulnerableUntil: 0     
  });

  // --- FUNÇÃO PARA TOCAR EFEITOS SONOROS (SFX) ---
  const playSound = (soundFile) => {
    // Criamos um novo áudio para cada som para permitir sobreposição (tiros rápidos)
    const audio = new Audio(soundFile);
    audio.volume = volume; // Usa o mesmo volume da música (ou podes criar um slider separado)
    audio.play().catch(e => console.log("Erro som:", e));
  };

  // --- GESTÃO DA MÚSICA ---
  useEffect(() => {
    const bgm = bgmRef.current;
    bgm.loop = true; 
    bgm.volume = volume; 

    const playMusic = () => {
      bgm.play().catch(error => console.log("Autoplay bloqueado"));
    };

    const startAudioOnInteraction = () => {
      playMusic();
      window.removeEventListener('click', startAudioOnInteraction);
      window.removeEventListener('keydown', startAudioOnInteraction);
    };

    window.addEventListener('click', startAudioOnInteraction);
    window.addEventListener('keydown', startAudioOnInteraction);

    return () => {
      bgm.pause();
      window.removeEventListener('click', startAudioOnInteraction);
      window.removeEventListener('keydown', startAudioOnInteraction);
    };
  }, []);

  useEffect(() => {
    bgmRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const savedScore = localStorage.getItem('spaceSurvivorHighScore');
    if (savedScore) setHighScore(parseInt(savedScore, 10));
  }, []);

  const handleStartGame = () => {
    gameState.current.projectiles = [];
    gameState.current.enemyProjectiles = [];
    gameState.current.enemies = [];
    gameState.current.playerX = GAME_WIDTH / 2;
    gameState.current.spawnRate = 2000; 
    gameState.current.enemiesPerSpawn = 1;
    gameState.current.difficultyLevel = 1;
    gameState.current.startTime = Date.now();
    gameState.current.lastEnemySpawn = Date.now();
    gameState.current.currentLives = 5;
    gameState.current.invulnerableUntil = 0;
    
    setLives(5);
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
    setShowOptions(false);
  };

  const handleQuit = () => {
    setIsPaused(false);
    setIsPlaying(false);
    setIsGameOver(false);
    setShowOptions(false);
  };

  const toggleOptions = () => setShowOptions(!showOptions);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showOptions) setShowOptions(false);
        else if (isPlaying && !isGameOver) setIsPaused((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, showOptions, isGameOver]);

  const checkCollision = (rect1, rect2) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.height + rect1.y > rect2.y
    );
  };

  const handlePlayerDamage = () => {
    gameState.current.currentLives -= 1;
    setLives(gameState.current.currentLives);
    
    // Som de explosão (Dano)
    playSound(explodeFile); // <--- SOM AQUI

    setTakeDamageEffect(true);
    setTimeout(() => setTakeDamageEffect(false), 200);

    if (gameState.current.currentLives <= 0) {
        setIsGameOver(true);
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('spaceSurvivorHighScore', score);
        }
    } else {
        gameState.current.invulnerableUntil = Date.now() + 2000;
    }
  };

  useEffect(() => {
    if (!isPlaying || isPaused || showOptions || isGameOver) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      const now = Date.now();
      const isInvulnerable = now < gameState.current.invulnerableUntil;

      const timeElapsed = now - gameState.current.startTime;
      const currentLevel = Math.floor(timeElapsed / 30000) + 1;
      
      if (currentLevel > gameState.current.difficultyLevel) {
        gameState.current.difficultyLevel = currentLevel;
        gameState.current.enemiesPerSpawn = Math.min(currentLevel, 5); 
      }

      if (now - gameState.current.lastEnemySpawn > gameState.current.spawnRate) {
        for (let i = 0; i < gameState.current.enemiesPerSpawn; i++) {
            const randomVx = (Math.random() - 0.5) * 6; 
            gameState.current.enemies.push({
              x: Math.random() * (GAME_WIDTH - 40),
              y: -40 - (Math.random() * 100),
              width: 40,
              height: 40,
              speed: 2 + (gameState.current.difficultyLevel * 0.2),
              vx: randomVx
            });
        }
        gameState.current.lastEnemySpawn = now;
      }

      if (motionBlur) {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.restore();
      } else {
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      }

      ctx.fillStyle = '#ff0000';
      gameState.current.projectiles.forEach((proj, pIndex) => {
        proj.y -= 10;
        ctx.fillRect(proj.x - 2, proj.y, 4, 15);
        if (proj.y < 0) gameState.current.projectiles.splice(pIndex, 1);
      });

      ctx.fillStyle = '#ff00ff';
      gameState.current.enemies.forEach((enemy, eIndex) => {
        enemy.y += enemy.speed;
        enemy.x += enemy.vx;
        if (enemy.x <= 0 || enemy.x + enemy.width >= GAME_WIDTH) enemy.vx = -enemy.vx;
        
        if (enemy.y > 0 && Math.random() < 0.005) {
            gameState.current.enemyProjectiles.push({
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height,
                width: 6, height: 12, speed: 6
            });
        }

        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(enemy.x + 10, enemy.y + 10, 20, 20);
        ctx.fillStyle = '#ff00ff';

        if (enemy.y > GAME_HEIGHT) gameState.current.enemies.splice(eIndex, 1);

        const playerRect = { x: gameState.current.playerX - 20, y: gameState.current.playerY, width: 40, height: 30 };
        
        if (!isInvulnerable && checkCollision(playerRect, enemy)) {
           handlePlayerDamage();
           gameState.current.enemies.splice(eIndex, 1);
        }

        gameState.current.projectiles.forEach((proj, pIndex) => {
            const bulletRect = { x: proj.x - 2, y: proj.y, width: 4, height: 15 };
            if (checkCollision(bulletRect, enemy)) {
                gameState.current.enemies.splice(eIndex, 1);
                gameState.current.projectiles.splice(pIndex, 1);
                setScore(prev => prev + 10);
                
                // Som de explosão (Inimigo)
                playSound(explodeFile); // <--- SOM AQUI
            }
        });
      });

      ctx.fillStyle = '#ffcc00';
      gameState.current.enemyProjectiles.forEach((eProj, epIndex) => {
          eProj.y += eProj.speed;
          ctx.fillRect(eProj.x - 3, eProj.y, eProj.width, eProj.height);
          if (eProj.y > GAME_HEIGHT) gameState.current.enemyProjectiles.splice(epIndex, 1);

          const playerRect = { x: gameState.current.playerX - 20, y: gameState.current.playerY, width: 40, height: 30 };
          if (!isInvulnerable && checkCollision(playerRect, eProj)) {
              handlePlayerDamage();
              gameState.current.enemyProjectiles.splice(epIndex, 1);
          }
      });

      if (!isGameOver) {
          const x = gameState.current.playerX;
          const y = gameState.current.playerY;
          ctx.fillStyle = '#00ff00'; 
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - 20, y + 30);
          ctx.lineTo(x + 20, y + 30);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.fillRect(x - 2, y + 10, 4, 4);
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    const handleMouseMove = (e) => {
      if (isPaused || showOptions || isGameOver) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      gameState.current.playerX = mouseX;
    };

    const handleMouseDown = () => {
      if (isPaused || showOptions || isGameOver) return;
      gameState.current.projectiles.push({
        x: gameState.current.playerX,
        y: gameState.current.playerY - 10
      });
      
      // Som de Tiro
      playSound(shootFile); // <--- SOM AQUI
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isPlaying, isPaused, showOptions, isGameOver, motionBlur, score, highScore, volume]); // Importante incluir 'volume' aqui

  // ... (o resto do return/JSX mantém-se igual) ...
  const renderHearts = () => {
    let hearts = [];
    for (let i = 0; i < lives; i++) hearts.push(<span key={i}>♥</span>);
    return hearts;
  };

  return (
    <div className="game-container">
      <SpaceBackground />
      {takeDamageEffect && <div className="damage-effect"></div>}

      {isPlaying && !isGameOver && (
          <div className="lives-display">{renderHearts()}</div>
      )}
      {isPlaying && !isGameOver && (
          <div className="game-hud">SCORE: {score}</div>
      )}

      {!isPlaying && !showOptions && !isGameOver && (
        <div className="menu-overlay">
          <h1 className="game-title">Space Survivor</h1>
          <button className="menu-button" onClick={handleStartGame}>Start Game</button>
          <button className="menu-button" onClick={toggleOptions}>Options</button>
          <div className="high-score-display">HIGH SCORE: {highScore}</div>
        </div>
      )}

      {isPlaying && isPaused && !showOptions && !isGameOver && (
        <div className="pause-overlay">
          <h2 className="pause-title">PAUSE</h2>
          <button className="menu-button" onClick={() => setIsPaused(false)}>Continue</button>
          <button className="menu-button" onClick={toggleOptions}>Options</button>
          <button className="menu-button" onClick={handleQuit}>Exit to Menu</button>
        </div>
      )}

      {showOptions && (
        <div className="menu-overlay">
          <h2 className="pause-title">OPTIONS</h2>
          <div className="option-row">
            <span className="option-label">Motion Blur</span>
            <button 
              className={`option-toggle ${motionBlur ? 'active' : ''}`} 
              onClick={() => setMotionBlur(!motionBlur)}
            >
              {motionBlur ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="option-row">
            <span className="option-label">Music Volume</span>
            <div className="volume-control">
              <input 
                type="range" min="0" max="1" step="0.1" 
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))} 
              />
              <span style={{color: 'white', width: '30px'}}>{Math.round(volume * 100)}%</span>
            </div>
          </div>
          <button className="menu-button back-btn" onClick={toggleOptions}>Back</button>
        </div>
      )}

      {isGameOver && (
        <div className="game-over-overlay">
          <h1 className="game-over-title">GAME OVER</h1>
          <div className="final-score">FINAL SCORE: {score}</div>
          {score >= highScore && score > 0 && (
              <div className="new-record">★ NEW HIGH SCORE! ★</div>
          )}
          <button className="menu-button" onClick={handleStartGame}>Try Again</button>
          <button className="menu-button" onClick={handleQuit}>Main Menu</button>
        </div>
      )}

      {isPlaying && <canvas ref={canvasRef} width={800} height={600} className="game-canvas" />}
    </div>
  );
};

export default SpaceSurvivor;