import React, { useRef, useEffect, useState } from 'react';
import './SpaceSurvivor.css';
import SpaceBackground from './SpaceBackground';

// --- SONS ---
import musicFile from './music.mp3'; 
import shootFile from './shoot.mp3';
import explodeFile from './explode.mp3';
import powerupFile from './powerup.mp3';

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

  const [hasTripleShot, setHasTripleShot] = useState(false); 

  const [motionBlur, setMotionBlur] = useState(true);
  const [volume, setVolume] = useState(0.5);

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
    powerUps: [], 
    nextEnemySpawnTime: 0, 
    startTime: 0,
    currentLives: 5,         
    invulnerableUntil: 0,
    tripleShotUntil: 0
  });

  const playSound = (soundFile) => {
    const audio = new Audio(soundFile);
    audio.volume = volume; 
    audio.play().catch(e => console.log("Erro som:", e));
  };

  useEffect(() => {
    const bgm = bgmRef.current;
    bgm.loop = true; bgm.volume = volume; 
    const playMusic = () => bgm.play().catch(() => {});
    const startAudio = () => { playMusic(); window.removeEventListener('click', startAudio); window.removeEventListener('keydown', startAudio); };
    window.addEventListener('click', startAudio); window.addEventListener('keydown', startAudio);
    return () => bgm.pause();
  }, []);

  useEffect(() => { bgmRef.current.volume = volume; }, [volume]);

  useEffect(() => {
    const savedScore = localStorage.getItem('spaceSurvivorHighScore');
    if (savedScore) setHighScore(parseInt(savedScore, 10));
  }, []);

  const handleStartGame = () => {
    gameState.current.projectiles = [];
    gameState.current.enemyProjectiles = [];
    gameState.current.enemies = [];
    gameState.current.powerUps = []; 
    gameState.current.playerX = GAME_WIDTH / 2;
    gameState.current.nextEnemySpawnTime = Date.now();
    gameState.current.startTime = Date.now();
    gameState.current.currentLives = 5;
    gameState.current.invulnerableUntil = 0;
    gameState.current.tripleShotUntil = 0;
    
    setLives(5);
    setScore(0);
    setHasTripleShot(false);
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
    playSound(explodeFile);
    setTakeDamageEffect(true);
    setTimeout(() => setTakeDamageEffect(false), 200);

    if (gameState.current.currentLives <= 0) {
        setIsGameOver(true);
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('spaceSurvivorHighScore', score);
        }
    } else {
        gameState.current.invulnerableUntil = Date.now() + 500;
    }
  };

  // --- FUNÇÃO PARA DESENHAR POLÍGONOS DINÂMICOS ---
  const drawPolygon = (ctx, x, y, radius, sides, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    const startAngle = -Math.PI / 2;
    ctx.moveTo(x + radius * Math.cos(startAngle), y + radius * Math.sin(startAngle));

    for (let i = 1; i <= sides; i++) {
        const angle = startAngle + (i * 2 * Math.PI / sides);
        ctx.lineTo(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
    }

    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // --- LOOP PRINCIPAL ---
  useEffect(() => {
    if (!isPlaying || isPaused || showOptions || isGameOver) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      const now = Date.now();
      const isInvulnerable = now < gameState.current.invulnerableUntil;
      
      const tripleShotActive = now < gameState.current.tripleShotUntil;
      if (tripleShotActive !== hasTripleShot) setHasTripleShot(tripleShotActive);

      // --- SPAWN INIMIGOS ---
      if (now > gameState.current.nextEnemySpawnTime) {
          const timeElapsed = now - gameState.current.startTime;
          
          const difficultyFactor = (timeElapsed / 500) + (score * 0.5);
          
          let targetDelay = 1500 - difficultyFactor;
          const minDelay = 300; 

          let spawnCount = 1;
          if (targetDelay < minDelay) {
              const excessDifficulty = minDelay - targetDelay;
              targetDelay = minDelay;
              spawnCount = 1 + Math.floor(excessDifficulty / 500);
          }
          spawnCount = Math.min(spawnCount, 10);

          for (let i = 0; i < spawnCount; i++) {
               const randomVx = (Math.random() - 0.5) * 6;
               const baseSpeed = 2 + (timeElapsed / 60000); 
               const yOffset = i * -60; 

               // --- SELETOR DE INIMIGOS ---
               const randType = Math.random();
               
               let hp = 1;
               let width = 40;
               let color = '#ff00ff'; // Roxo (Básico)
               let speedMultiplier = 1;

               if (randType >= 0.70 && randType < 0.90) {
                   hp = 3;
                   width = 50; 
                   color = '#ff8800'; 
                   speedMultiplier = 0.8;
               } 
               else if (randType >= 0.90) {
                   hp = 5;
                   width = 70; 
                   color = '#ff0000'; 
                   speedMultiplier = 0.5; 
               }

               gameState.current.enemies.push({
                  x: Math.random() * (GAME_WIDTH - width),
                  y: -width + yOffset,
                  width: width,
                  height: width, 
                  speed: baseSpeed * speedMultiplier,
                  vx: randomVx,
                  hp: hp,           
                  maxHp: hp,        
                  color: color,
                  hitFlash: 0       
              });
          }

          const randomJitter = Math.random() * 200;
          gameState.current.nextEnemySpawnTime = now + targetDelay + randomJitter;
      }

      // LIMPAR ECRÃ
      if (motionBlur) {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.restore();
      } else {
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      }

      // --- POWER UPS ---
      gameState.current.powerUps.forEach((pu, index) => {
          pu.y += pu.speed; 
          if (pu.type === 'HEAL') {
              ctx.fillStyle = '#ff0055'; 
              ctx.beginPath(); ctx.arc(pu.x + 15, pu.y + 15, 15, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = 'white'; ctx.fillRect(pu.x + 12, pu.y + 5, 6, 20); ctx.fillRect(pu.x + 5, pu.y + 12, 20, 6);
          } else if (pu.type === 'TRIPLE_SHOT') {
              ctx.fillStyle = '#00ffff'; 
              ctx.beginPath(); ctx.moveTo(pu.x + 15, pu.y); ctx.lineTo(pu.x + 30, pu.y + 15); ctx.lineTo(pu.x + 15, pu.y + 30); ctx.lineTo(pu.x, pu.y + 15); ctx.closePath(); ctx.fill();
              ctx.fillStyle = 'black'; ctx.font = '20px Arial'; ctx.fillText('⚡', pu.x + 8, pu.y + 22);
          }
          if (pu.y > GAME_HEIGHT) gameState.current.powerUps.splice(index, 1);

          const playerRect = { x: gameState.current.playerX - 20, y: gameState.current.playerY, width: 40, height: 30 };
          if (checkCollision(playerRect, pu)) {
              playSound(powerupFile); 
              if (pu.type === 'HEAL') {
                  gameState.current.currentLives += 1;
                  setLives(gameState.current.currentLives);
              } else if (pu.type === 'TRIPLE_SHOT') {
                  gameState.current.tripleShotUntil = Date.now() + 5000;
                  setHasTripleShot(true);
              }
              gameState.current.powerUps.splice(index, 1);
          }
      });

      // --- BALAS JOGADOR ---
      ctx.fillStyle = hasTripleShot ? '#00ffff' : '#ff0000'; 
      gameState.current.projectiles.forEach((proj, pIndex) => {
        proj.y -= 10;
        if (proj.vx) proj.x += proj.vx; 
        ctx.fillRect(proj.x - 2, proj.y, 4, 15);
        if (proj.y < 0 || proj.x < 0 || proj.x > GAME_WIDTH) gameState.current.projectiles.splice(pIndex, 1);
      });

      // --- INIMIGOS ---
      gameState.current.enemies.forEach((enemy, eIndex) => {
        enemy.y += enemy.speed;
        enemy.x += enemy.vx;
        if (enemy.x <= 0 || enemy.x + enemy.width >= GAME_WIDTH) enemy.vx = -enemy.vx;
        
        // Disparar
        if (enemy.y > 0 && Math.random() < 0.005) {
            gameState.current.enemyProjectiles.push({
                x: enemy.x + enemy.width / 2, y: enemy.y + enemy.height,
                width: 6, height: 12, speed: 6
            });
        }

        // --- DESENHO LÓGICO UNIFICADO ---
        const drawColor = (enemy.hitFlash > 0) ? '#ffffff' : enemy.color;
        if (enemy.hitFlash > 0) enemy.hitFlash--;

        const cx = enemy.x + enemy.width / 2; 
        const cy = enemy.y + enemy.height / 2; 
        const radius = enemy.width / 2;

        const currentSides = enemy.hp + 3;

        // 1. DESENHAR CORPO
        if (currentSides === 4) {
             // Quadrado
            ctx.fillStyle = drawColor;
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        } else {
             // Polígonos
            drawPolygon(ctx, cx, cy, radius, currentSides, drawColor);
        }

        // 2. DESENHAR OLHO MAU (AGORA PARA TODOS!)
        // Pupila preta no centro
        ctx.fillStyle = '#000';
        ctx.beginPath();
        // O tamanho do olho é proporcional ao tamanho do corpo
        ctx.arc(cx, cy, radius / 3, 0, Math.PI*2);
        ctx.fill();

        if (enemy.y > GAME_HEIGHT) gameState.current.enemies.splice(eIndex, 1);

        // Colisão Nave
        const playerRect = { x: gameState.current.playerX - 20, y: gameState.current.playerY, width: 40, height: 30 };
        if (!isInvulnerable && checkCollision(playerRect, enemy)) {
           handlePlayerDamage();
           gameState.current.enemies.splice(eIndex, 1);
        }

        // --- COLISÃO BALA vs INIMIGO ---
        gameState.current.projectiles.forEach((proj, pIndex) => {
            const bulletRect = { x: proj.x - 2, y: proj.y, width: 4, height: 15 };
            
            if (checkCollision(bulletRect, enemy)) {
                gameState.current.projectiles.splice(pIndex, 1);
                
                enemy.hp -= 1;
                enemy.hitFlash = 3; 

                if (enemy.hp <= 0) {
                    const dropX = enemy.x;
                    const dropY = enemy.y;
                    gameState.current.enemies.splice(eIndex, 1);
                    
                    const points = enemy.maxHp * 10;
                    setScore(prev => prev + points);
                    playSound(explodeFile);

                    let dropChance = 0.12 + ((enemy.maxHp - 1) * 0.1); 
                    
                    if (Math.random() < dropChance) { 
                        const type = Math.random() < 0.5 ? 'HEAL' : 'TRIPLE_SHOT';
                        gameState.current.powerUps.push({
                            x: dropX + 5, y: dropY, width: 30, height: 30, speed: 2, type: type
                        });
                    }
                } else {
                    enemy.y -= 5;
                    enemy.x += (Math.random() - 0.5) * 5;
                }
            }
        });
      });

      // --- BALAS INIMIGAS ---
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

      // --- NAVE ---
      if (!isGameOver) {
          const x = gameState.current.playerX;
          const y = gameState.current.playerY;
          
          if (isInvulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
              ctx.globalAlpha = 0.5;
          }

          ctx.fillStyle = hasTripleShot ? '#00ffff' : '#00ff00'; 
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - 20, y + 30);
          ctx.lineTo(x + 20, y + 30);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.fillRect(x - 2, y + 10, 4, 4);
          
          ctx.globalAlpha = 1.0; 
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
      const pX = gameState.current.playerX;
      const pY = gameState.current.playerY - 10;
      
      gameState.current.projectiles.push({ x: pX, y: pY, vx: 0 });

      if (Date.now() < gameState.current.tripleShotUntil) {
          gameState.current.projectiles.push({ x: pX, y: pY, vx: -2 }); 
          gameState.current.projectiles.push({ x: pX, y: pY, vx: 2 }); 
      }
      playSound(shootFile);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isPlaying, isPaused, showOptions, isGameOver, motionBlur, score, highScore, volume, hasTripleShot]); 

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
          <div className="lives-display" style={{flexWrap: 'wrap'}}>{renderHearts()}</div>
      )}
      {isPlaying && !isGameOver && (
          <div className="game-hud">SCORE: {score}</div>
      )}
      
      {isPlaying && hasTripleShot && !isGameOver && (
          <div style={{
              position: 'absolute', top: '60px', left: '20px', 
              color: '#00ffff', fontSize: '1.2rem', fontWeight: 'bold', textShadow: '0 0 10px #00ffff'
          }}>
              ⚡ TRIPLE SHOT
          </div>
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
            <button className={`option-toggle ${motionBlur ? 'active' : ''}`} onClick={() => setMotionBlur(!motionBlur)}>{motionBlur ? 'ON' : 'OFF'}</button>
          </div>
          <div className="option-row">
            <span className="option-label">Music Volume</span>
            <div className="volume-control">
              <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} />
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