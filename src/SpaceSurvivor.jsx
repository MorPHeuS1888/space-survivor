import React, { useRef, useEffect, useState } from 'react';
import './SpaceSurvivor.css';
import SpaceBackground from './SpaceBackground';

// --- NOVOS COMPONENTES (Certifica-te que os criaste na pasta components) ---
import Shop from './components/Shop';
import Leaderboard from './components/Leaderboard';

// --- FIREBASE IMPORTS ---
import { db } from './firebase';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';

// --- OUTROS IMPORTS ---
import { TRANSLATIONS } from './i18n';
import { GAME_WIDTH, GAME_HEIGHT, PRICES, INITIAL_UPGRADES } from './gameConfig';
import { checkCollision, drawPolygon } from './gameUtils';

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
  const [showShop, setShowShop] = useState(false); 
  
  // LEADERBOARD & SUBMIT
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [playerName, setPlayerName] = useState('');
  
  const [submitStatus, setSubmitStatus] = useState(null); 
  const [submitMessage, setSubmitMessage] = useState('');

  // CONFIGURAÇÕES
  const [language, setLanguage] = useState('en'); 
  const t = TRANSLATIONS[language]; 
  const [motionBlur, setMotionBlur] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3); 
  const [takeDamageEffect, setTakeDamageEffect] = useState(false);

  const [hasTripleShot, setHasTripleShot] = useState(false); 

  const [totalScrap, setTotalScrap] = useState(0); 
  const [runScrap, setRunScrap] = useState(0);     

  const [upgrades, setUpgrades] = useState(INITIAL_UPGRADES);

  const bgmRef = useRef(new Audio(musicFile));
  const canvasRef = useRef(null);
  
  // REF PARA CORRIGIR O BUG DO TEMPO NO MENU
  const pauseStartRef = useRef(0);

  const gameState = useRef({
    playerX: GAME_WIDTH / 2,
    playerY: GAME_HEIGHT - 50,
    projectiles: [],
    enemyProjectiles: [],
    enemies: [],
    powerUps: [],
    scraps: [], 
    collectedScrap: 0, 
    magnetRange: 50,  
    isFiring: false,
    lastShotTime: 0,
    fireRate: 150, 
    nextEnemySpawnTime: 0, 
    startTime: 0,
    currentLives: 3,        
    invulnerableUntil: 0,
    tripleShotUntil: 0
  });

  // --- FUNÇÕES AUXILIARES ---
  
  const cycleLanguage = () => {
    const langs = Object.keys(TRANSLATIONS);
    const currentIndex = langs.indexOf(language);
    const nextIndex = (currentIndex + 1) % langs.length;
    setLanguage(langs[nextIndex]);
    localStorage.setItem('spaceSurvivorLang', langs[nextIndex]);
  };

  const playSound = (soundFile) => {
    const audio = new Audio(soundFile);
    audio.volume = volume; 
    audio.play().catch(e => console.log("Erro som:", e));
  };

  // --- LÓGICA DE FULLSCREEN (COM KEYBOARD LOCK) ---
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        if (navigator.keyboard && navigator.keyboard.lock) {
            navigator.keyboard.lock(['Escape']).catch(e => console.log(e));
        }
      }).catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        if (navigator.keyboard && navigator.keyboard.unlock) {
            navigator.keyboard.unlock();
        }
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && navigator.keyboard && navigator.keyboard.unlock) {
          navigator.keyboard.unlock();
      }
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // --- CORREÇÃO DO BUG DO TEMPO (FREEZE TIME) ---
  useEffect(() => {
    if (!isPlaying || isGameOver) return;
    const isInterrupted = isPaused || showOptions || showShop || showLeaderboard;

    if (isInterrupted) {
        pauseStartRef.current = Date.now();
    } else {
        if (pauseStartRef.current > 0) {
            const timePaused = Date.now() - pauseStartRef.current;
            gameState.current.tripleShotUntil += timePaused;
            gameState.current.invulnerableUntil += timePaused;
            gameState.current.nextEnemySpawnTime += timePaused;
            gameState.current.startTime += timePaused;
            pauseStartRef.current = 0;
        }
    }
  }, [isPlaying, isGameOver, isPaused, showOptions, showShop, showLeaderboard]);


  // --- EFEITOS DE INICIALIZAÇÃO ---

  useEffect(() => {
    const bgm = bgmRef.current;
    bgm.loop = true; bgm.volume = volume; 
    const playMusic = () => bgm.play().catch(() => {});
    const startAudio = () => { playMusic(); window.removeEventListener('click', startAudio); window.removeEventListener('keydown', startAudio); };
    window.addEventListener('click', startAudio); window.addEventListener('keydown', startAudio);
    return () => bgm.pause();
  }, []);

  useEffect(() => { bgmRef.current.volume = volume; }, [volume]);

  // --- LÓGICA DE TECLAS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        // Se estiver em fullscreen, o lock deve impedir o ESC de sair,
        // mas se o browser ignorar o lock, a tecla funciona na mesma para abrir o menu.
        if (showOptions) setShowOptions(false);
        else if (showLeaderboard) setShowLeaderboard(false);
        else if (showShop) setShowShop(false);
        else if (isPlaying && !isGameOver) setIsPaused((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, showOptions, isGameOver, showLeaderboard, showShop]);

  useEffect(() => {
    const savedScore = localStorage.getItem('spaceSurvivorHighScore');
    if (savedScore) setHighScore(parseInt(savedScore, 10));

    const savedScrap = localStorage.getItem('spaceSurvivorTotalScrap');
    if (savedScrap) setTotalScrap(parseInt(savedScrap, 10));

    const savedUpgrades = localStorage.getItem('spaceSurvivorUpgrades');
    if (savedUpgrades) {
        try {
            let loaded = JSON.parse(savedUpgrades);
            loaded = { ...INITIAL_UPGRADES, ...loaded };
            const premiumItems = ['autofire', 'magnet', 'ricochet'];
            premiumItems.forEach(key => { if (loaded[key] > 2) loaded[key] = 2; });
            setUpgrades(loaded);
        } catch (e) {
            setUpgrades(INITIAL_UPGRADES);
        }
    }
    
    const savedLang = localStorage.getItem('spaceSurvivorLang');
    if (savedLang && TRANSLATIONS[savedLang]) setLanguage(savedLang);
    
    const savedName = localStorage.getItem('spaceSurvivorPlayerName');
    if (savedName) setPlayerName(savedName);
  }, []);

  // --- FIREBASE LOGIC ---
  const fetchLeaderboard = async () => {
      setIsLoadingLeaderboard(true);
      try {
          const q = query(collection(db, "scores"), orderBy("score", "desc"), limit(10));
          const querySnapshot = await getDocs(q);
          const data = querySnapshot.docs.map(doc => doc.data());
          setLeaderboardData(data);
      } catch (error) {
          console.error("Error fetching leaderboard: ", error);
      }
      setIsLoadingLeaderboard(false);
  };

  const openLeaderboard = () => {
      setShowLeaderboard(true);
      fetchLeaderboard();
  };

  const submitScore = async () => {
      // 1. Validações básicas (impede envio se não houver nome, score for 0 ou já tiver enviado com sucesso)
      if (!playerName || score === 0 || submitStatus === 'success') return;
      
      const cleanName = playerName.trim(); // Remove espaços antes e depois
      if (cleanName === "") return;

      try {
          // 2. LÓGICA ANTI-DUPLICADOS
          // Transformamos o nome em MAIÚSCULAS para usar como ID Único.
          // Assim: "Tiago", "tiago" e "TIAGO" são tratados como a mesma pessoa.
          const uniqueId = cleanName.toUpperCase(); 
          
          // Referência ao documento usando este ID único
          const scoreRef = doc(db, "scores", uniqueId);
          const docSnap = await getDoc(scoreRef);

          let shouldSave = false;

          if (docSnap.exists()) {
              // O jogador JÁ EXISTE na base de dados.
              const oldScore = docSnap.data().score;
              
              // Só atualizamos se o novo score for maior que o antigo
              if (score > oldScore) {
                  shouldSave = true; 
              } else {
                  // CASO 1: Score é menor ou igual (Falha)
                  setSubmitStatus('fail');
                  setSubmitMessage(`${t.gameover.lowScore} (${oldScore})`);
                  
                  // Limpa a mensagem de erro após 3 segundos
                  setTimeout(() => {
                      setSubmitStatus(null);
                      setSubmitMessage('');
                  }, 3000);
                  return; // Sai da função sem gravar
              }
          } else {
              // O jogador NÃO EXISTE (é a primeira vez), por isso gravamos.
              shouldSave = true;
          }

          // 3. GRAVAR NA BASE DE DADOS
          if (shouldSave) {
              await setDoc(scoreRef, {
                  name: cleanName, // Guardamos o nome "bonito" (como o jogador escreveu) para exibir
                  score: score,
                  date: new Date()
              });
              
              // CASO 2: Sucesso
              setSubmitStatus('success');
              setSubmitMessage(t.gameover.saved);
              
              // Guarda o nome no navegador para a próxima vez
              localStorage.setItem('spaceSurvivorPlayerName', cleanName);
              
              // Se a tabela estiver aberta, atualiza-a imediatamente
              if (showLeaderboard) fetchLeaderboard();
          }

      } catch (e) {
          console.error("Erro ao gravar score: ", e);
          setSubmitStatus('fail');
          setSubmitMessage(t.gameover.error);
      }
  };

  const buyUpgrade = (type) => {
    const isOneTime = ['autofire', 'magnet', 'ricochet'].includes(type);
    const currentLvl = upgrades[type];

    if (isOneTime) {
        let newLevel = currentLvl;
        if (currentLvl === 0) {
            const cost = PRICES[type]();
            if (totalScrap >= cost) {
                const newScrap = totalScrap - cost;
                setTotalScrap(newScrap);
                localStorage.setItem('spaceSurvivorTotalScrap', newScrap);
                newLevel = 2; 
                playSound(powerupFile);
            } else return; 
        } else {
            newLevel = (currentLvl === 2) ? 1 : 2; 
        }
        const newUpgrades = { ...upgrades, [type]: newLevel };
        setUpgrades(newUpgrades);
        localStorage.setItem('spaceSurvivorUpgrades', JSON.stringify(newUpgrades));
        return;
    }

    const cost = PRICES[type](currentLvl);
    if (totalScrap >= cost) {
        const newScrap = totalScrap - cost;
        setTotalScrap(newScrap);
        localStorage.setItem('spaceSurvivorTotalScrap', newScrap);
        const newUpgrades = { ...upgrades, [type]: currentLvl + 1 };
        setUpgrades(newUpgrades);
        localStorage.setItem('spaceSurvivorUpgrades', JSON.stringify(newUpgrades));
        playSound(powerupFile);
    }
  };

  const handleStartGame = () => {
    gameState.current.projectiles = [];
    gameState.current.enemyProjectiles = [];
    gameState.current.enemies = [];
    gameState.current.powerUps = []; 
    gameState.current.scraps = [];
    gameState.current.collectedScrap = 0; 
    setRunScrap(0);
    
    gameState.current.magnetRange = upgrades.magnet === 2 ? 2000 : 60;
    
    const startingLives = 3 + upgrades.lives;
    gameState.current.currentLives = startingLives;
    setLives(startingLives);

    gameState.current.playerX = GAME_WIDTH / 2;
    gameState.current.nextEnemySpawnTime = Date.now();
    gameState.current.startTime = Date.now();
    gameState.current.invulnerableUntil = 0;
    gameState.current.tripleShotUntil = 0;
    gameState.current.isFiring = false; 
    
    setScore(0);
    setSubmitStatus(null);
    setSubmitMessage('');
    setHasTripleShot(false);
    setIsGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
    setShowOptions(false);
    setShowShop(false);
    setShowLeaderboard(false);
  };

  const handleQuit = () => {
    setIsPaused(false);
    setIsPlaying(false);
    setIsGameOver(false);
    setShowOptions(false);
  };

  const toggleOptions = () => setShowOptions(!showOptions);

  const handlePlayerDamage = () => {
    gameState.current.currentLives -= 1;
    setLives(gameState.current.currentLives);
    playSound(explodeFile);
    setTakeDamageEffect(true);
    setTimeout(() => setTakeDamageEffect(false), 200);

    if (gameState.current.currentLives <= 0) {
        setIsGameOver(true);
        const moneyEarned = gameState.current.collectedScrap;
        const newTotal = totalScrap + moneyEarned;
        setTotalScrap(newTotal);
        localStorage.setItem('spaceSurvivorTotalScrap', newTotal);
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('spaceSurvivorHighScore', score);
        }
    } else {
        gameState.current.invulnerableUntil = Date.now() + 500;
    }
  };

  const spawnScrap = (x, y, maxHp) => {
    const scrapAmount = Math.floor(Math.random() * 2) + maxHp; 
    for (let s = 0; s < scrapAmount; s++) {
        gameState.current.scraps.push({
            x: x + (Math.random() * 20 - 10),
            y: y + (Math.random() * 20 - 10),
            width: 12, height: 12,
            vx: (Math.random() - 0.5) * 4, vy: (Math.random() * -3) - 1, 
            value: 10 
        });
    }
  };

  const shoot = () => {
      const now = Date.now();
      if (now - gameState.current.lastShotTime < gameState.current.fireRate) return;

      const pX = gameState.current.playerX;
      const pY = gameState.current.playerY - 10;
      gameState.current.projectiles.push({ x: pX, y: pY, vx: 0 });
      if (Date.now() < gameState.current.tripleShotUntil) {
          gameState.current.projectiles.push({ x: pX, y: pY, vx: -2 }); 
          gameState.current.projectiles.push({ x: pX, y: pY, vx: 2 }); 
      }
      playSound(shootFile);
      gameState.current.lastShotTime = now;
  };

  const destroyEnemy = (enemy, index) => {
      if (!gameState.current.enemies[index]) return; 
      const dropX = enemy.x; const dropY = enemy.y;
      gameState.current.enemies.splice(index, 1);
      setScore(prev => prev + enemy.maxHp * 10);
      playSound(explodeFile);
      spawnScrap(dropX, dropY, enemy.maxHp);
      if (Math.random() < (0.12 + ((enemy.maxHp - 1) * 0.1))) { 
          const type = Math.random() < 0.5 ? 'HEAL' : 'TRIPLE_SHOT';
          gameState.current.powerUps.push({ x: dropX + 5, y: dropY, width: 30, height: 30, speed: 2, type: type });
      }
  };

  // --- RENDER LOOP (JOGO) ---
  useEffect(() => {
    if (!isPlaying || isPaused || showOptions || showShop || isGameOver || showLeaderboard) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      const now = Date.now();
      const isInvulnerable = now < gameState.current.invulnerableUntil;
      const tripleShotActive = now < gameState.current.tripleShotUntil;
      if (tripleShotActive !== hasTripleShot) setHasTripleShot(tripleShotActive);

      if (upgrades.autofire === 2 && gameState.current.isFiring) {
          shoot();
      }

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
               const randType = Math.random();
               let hp = 1; let width = 40; let color = '#bc13fe'; let speedMultiplier = 1;
               if (randType >= 0.70 && randType < 0.90) { hp = 3; width = 50; color = '#ff8800'; speedMultiplier = 0.8; } 
               else if (randType >= 0.90) { hp = 5; width = 70; color = '#ff0000'; speedMultiplier = 0.5; }

               gameState.current.enemies.push({
                  x: Math.random() * (GAME_WIDTH - width),
                  y: -width + yOffset,
                  width: width, height: width, 
                  speed: baseSpeed * speedMultiplier,
                  vx: randomVx, hp: hp, maxHp: hp, color: color, hitFlash: 0      
              });
          }
          gameState.current.nextEnemySpawnTime = now + targetDelay + (Math.random() * 200);
      }

      if (motionBlur) {
        ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT); ctx.restore();
      } else {
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      }

      gameState.current.scraps.forEach((scrap, sIndex) => {
          const dx = gameState.current.playerX - scrap.x;
          const dy = gameState.current.playerY - scrap.y;
          const distance = Math.hypot(dx, dy);

          if (distance < gameState.current.magnetRange || scrap.isMagnetized) {
              scrap.isMagnetized = true; 
              const homingSpeed = 12; 
              scrap.vx = (dx / distance) * homingSpeed;
              scrap.vy = (dy / distance) * homingSpeed;
          } else {
              scrap.vy += 0.1; scrap.vx *= 0.95; 
          }
          scrap.x += scrap.vx; scrap.y += scrap.vy;

          ctx.save(); ctx.translate(scrap.x, scrap.y); ctx.fillStyle = '#39ff14';
          ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(6, 0); ctx.lineTo(0, 6); ctx.lineTo(-6, 0); ctx.closePath(); ctx.fill();
          if (scrap.isMagnetized) { ctx.shadowBlur = 10; ctx.shadowColor = '#39ff14'; ctx.stroke(); ctx.shadowBlur = 0; }
          ctx.restore();

          if (!scrap.isMagnetized && scrap.y > GAME_HEIGHT + 50) gameState.current.scraps.splice(sIndex, 1);

          const pRect = { x: gameState.current.playerX - 20, y: gameState.current.playerY, width: 40, height: 30 };
          const sRect = { x: scrap.x - 6, y: scrap.y - 6, width: 12, height: 12 };
          if (checkCollision(pRect, sRect)) {
              gameState.current.collectedScrap += scrap.value;
              setRunScrap(gameState.current.collectedScrap);
              gameState.current.scraps.splice(sIndex, 1);
          }
      });

      gameState.current.powerUps.forEach((pu, index) => {
          pu.y += pu.speed; 
          if (pu.type === 'HEAL') { ctx.fillStyle = '#ff0055'; ctx.beginPath(); ctx.arc(pu.x + 15, pu.y + 15, 15, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'white'; ctx.fillRect(pu.x + 12, pu.y + 5, 6, 20); ctx.fillRect(pu.x + 5, pu.y + 12, 20, 6); }
          else if (pu.type === 'TRIPLE_SHOT') { ctx.fillStyle = '#00f0ff'; ctx.beginPath(); ctx.moveTo(pu.x + 15, pu.y); ctx.lineTo(pu.x + 30, pu.y + 15); ctx.lineTo(pu.x + 15, pu.y + 30); ctx.lineTo(pu.x, pu.y + 15); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'black'; ctx.font = '20px Arial'; ctx.fillText('⚡', pu.x + 8, pu.y + 22); }
          if (pu.y > GAME_HEIGHT) gameState.current.powerUps.splice(index, 1);
          if (checkCollision({ x: gameState.current.playerX - 20, y: gameState.current.playerY, width: 40, height: 30 }, pu)) {
              playSound(powerupFile); 
              if (pu.type === 'HEAL') { gameState.current.currentLives += 1; setLives(gameState.current.currentLives); }
              else if (pu.type === 'TRIPLE_SHOT') { gameState.current.tripleShotUntil = Date.now() + 5000; setHasTripleShot(true); }
              gameState.current.powerUps.splice(index, 1);
          }
      });

      ctx.fillStyle = '#00f0ff'; ctx.shadowBlur = 10; ctx.shadowColor = '#00f0ff';
      gameState.current.projectiles.forEach((proj, pIndex) => {
        const bulletSpeed = 10; 
        proj.y -= bulletSpeed;
        if (proj.vx) proj.x += proj.vx; 

        if (upgrades.ricochet === 2 && !proj.hasRicocheted) {
             if (proj.x < 0 || proj.x > GAME_WIDTH) { proj.vx = -proj.vx; proj.hasRicocheted = true; }
        }
        ctx.fillRect(proj.x - 2, proj.y, 4, 15);
        if (proj.y < -50 || (upgrades.ricochet !== 2 && (proj.x < 0 || proj.x > GAME_WIDTH))) gameState.current.projectiles.splice(pIndex, 1);
      });
      ctx.shadowBlur = 0;

      gameState.current.enemies.forEach((enemy, eIndex) => {
        let moveSpeed = enemy.speed;
        enemy.y += moveSpeed;
        enemy.x += enemy.vx;
        if (enemy.x <= 0 || enemy.x + enemy.width >= GAME_WIDTH) enemy.vx = -enemy.vx;
        if (enemy.y > 0 && Math.random() < 0.005) gameState.current.enemyProjectiles.push({ x: enemy.x + enemy.width / 2, y: enemy.y + enemy.height, width: 6, height: 12, speed: 6 });
        
        const drawColor = (enemy.hitFlash > 0) ? '#ffffff' : enemy.color;
        if (enemy.hitFlash > 0) enemy.hitFlash--;
        const cx = enemy.x + enemy.width / 2; const cy = enemy.y + enemy.height / 2; const radius = enemy.width / 2; const currentSides = enemy.hp + 3;
        if (currentSides === 4) { ctx.fillStyle = drawColor; ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height); } else { drawPolygon(ctx, cx, cy, radius, currentSides, drawColor); }
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx, cy, radius / 3, 0, Math.PI*2); ctx.fill();
        if (enemy.y > GAME_HEIGHT) gameState.current.enemies.splice(eIndex, 1);
        if (!isInvulnerable && checkCollision({ x: gameState.current.playerX - 20, y: gameState.current.playerY, width: 40, height: 30 }, enemy)) { handlePlayerDamage(); gameState.current.enemies.splice(eIndex, 1); }

        gameState.current.projectiles.forEach((proj, pIndex) => {
            if (checkCollision({ x: proj.x - 2, y: proj.y, width: 4, height: 15 }, enemy)) {
                gameState.current.projectiles.splice(pIndex, 1);
                enemy.hp -= 1; enemy.hitFlash = 3; 
                if (enemy.hp <= 0) destroyEnemy(enemy, eIndex); else { enemy.y -= 5; enemy.x += (Math.random() - 0.5) * 5; }
            }
        });
      });

      ctx.fillStyle = '#ffcc00';
      gameState.current.enemyProjectiles.forEach((eProj, epIndex) => {
          let bSpeed = eProj.speed;
          eProj.y += bSpeed; ctx.fillRect(eProj.x - 3, eProj.y, eProj.width, eProj.height);
          if (eProj.y > GAME_HEIGHT) gameState.current.enemyProjectiles.splice(epIndex, 1);
          if (!isInvulnerable && checkCollision({ x: gameState.current.playerX - 20, y: gameState.current.playerY, width: 40, height: 30 }, eProj)) { handlePlayerDamage(); gameState.current.enemyProjectiles.splice(epIndex, 1); }
      });

      if (!isGameOver) {
          const x = gameState.current.playerX; const y = gameState.current.playerY;
          if (isInvulnerable && Math.floor(Date.now() / 100) % 2 === 0) ctx.globalAlpha = 0.5;
          ctx.fillStyle = '#00f0ff'; ctx.shadowBlur = 15; ctx.shadowColor = '#00f0ff';
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 20, y + 30); ctx.lineTo(x + 20, y + 30); ctx.closePath(); ctx.fill();
          ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.fillRect(x - 2, y + 10, 4, 4); ctx.globalAlpha = 1.0; 
      }
      animationFrameId = window.requestAnimationFrame(render);
    };
    render();

    const handleMouseMove = (e) => {
      if (isPaused || showOptions || showShop || isGameOver || showLeaderboard) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      gameState.current.playerX = mouseX;
    };
    const handleMouseDown = () => {
      if (isPaused || showOptions || showShop || isGameOver || showLeaderboard) return;
      if (upgrades.autofire === 2) { gameState.current.isFiring = true; shoot(); } else { shoot(); }
    };
    const handleMouseUp = () => { gameState.current.isFiring = false; };

    canvas.addEventListener('mousemove', handleMouseMove); canvas.addEventListener('mousedown', handleMouseDown); window.addEventListener('mouseup', handleMouseUp);
    return () => { window.cancelAnimationFrame(animationFrameId); canvas.removeEventListener('mousemove', handleMouseMove); canvas.removeEventListener('mousedown', handleMouseDown); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isPlaying, isPaused, showOptions, showShop, isGameOver, motionBlur, score, highScore, volume, hasTripleShot, upgrades, language, showLeaderboard]); 

  return (
    <div className="game-container">
      <SpaceBackground />
      {takeDamageEffect && <div className="damage-effect"></div>}
      
      {isPlaying && !isGameOver && <div className="game-hud"><div>{t.hud.score}: {score}</div><div style={{color: '#39ff14', fontSize: '1.2rem', marginTop: '5px', textShadow: '0 0 5px #39ff14'}}>$ {runScrap}</div></div>}
      {isPlaying && !isGameOver && <div className="lives-display" style={{flexWrap: 'wrap'}}>{Array.from({length: lives}).map((_, i) => <span key={i}>♥</span>)}</div>}
      {isPlaying && hasTripleShot && !isGameOver && <div style={{position: 'absolute', top: '60px', left: '20px', color: '#00f0ff', fontSize: '1.2rem', fontWeight: 'bold', textShadow: '0 0 10px #00f0ff'}}>⚡ {t.hud.triple}</div>}

      {!isPlaying && !showOptions && !showShop && !showLeaderboard && !isGameOver && (
        <div className="menu-overlay">
          <h1 className="game-title">Space Survivor</h1>
          <div style={{color: '#39ff14', fontSize: '1.5rem', marginBottom: '20px', border: '2px solid #39ff14', padding: '10px 30px', backgroundColor: 'rgba(0,0,0,0.5)', boxShadow: '0 0 15px rgba(57, 255, 20, 0.3)'}}>{t.menu.bank}: $ {totalScrap}</div>
          <button className="menu-button" onClick={handleStartGame}>{t.menu.start}</button>
          <button className="menu-button" onClick={() => setShowShop(true)} style={{borderColor: '#39ff14', color: '#39ff14'}}>{t.menu.hangar}</button>
          <button className="menu-button" onClick={openLeaderboard} style={{borderColor: '#bc13fe', color: '#bc13fe'}}>{t.menu.leaderboard}</button>
          <button className="menu-button" onClick={toggleOptions}>{t.menu.options}</button>
        </div>
      )}

      {/* COMPONENTE LEADERBOARD */}
      {showLeaderboard && (
        <Leaderboard 
            t={t} 
            data={leaderboardData} 
            isLoading={isLoadingLeaderboard} 
            onClose={() => setShowLeaderboard(false)} 
        />
      )}

      {/* COMPONENTE SHOP */}
      {showShop && (
        <Shop 
            t={t} 
            upgrades={upgrades} 
            totalScrap={totalScrap} 
            buyUpgrade={buyUpgrade} 
            onClose={() => setShowShop(false)} 
        />
      )}

      {isPlaying && isPaused && !showOptions && !showShop && !isGameOver && (
        <div className="pause-overlay"><h2 className="pause-title">{t.pause.title}</h2><button className="menu-button" onClick={() => setIsPaused(false)}>{t.pause.continue}</button><button className="menu-button" onClick={toggleOptions}>{t.menu.options}</button><button className="menu-button" onClick={handleQuit}>{t.pause.exit}</button></div>
      )}
      
      {showOptions && <div className="menu-overlay"><h2 className="pause-title">{t.options.title}</h2><div className="option-row"><span className="option-label">{t.options.lang}</span><button className="option-toggle" style={{width: '120px'}} onClick={cycleLanguage}>{TRANSLATIONS[language].name}</button></div><div className="option-row"><span className="option-label">{t.options.fullscreen}</span><button className={`option-toggle ${isFullscreen ? 'active' : ''}`} onClick={toggleFullscreen}>{isFullscreen ? 'ON' : 'OFF'}</button></div><div className="option-row"><span className="option-label">{t.options.blur}</span><button className={`option-toggle ${motionBlur ? 'active' : ''}`} onClick={() => setMotionBlur(!motionBlur)}>{motionBlur ? 'ON' : 'OFF'}</button></div><div className="option-row"><span className="option-label">{t.options.music}</span><div className="volume-control"><input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} /><span style={{color: 'white', width: '30px'}}>{Math.round(volume * 100)}%</span></div></div><button className="menu-button back-btn" onClick={toggleOptions}>{t.options.back}</button></div>}
      
      {isGameOver && (
        <div className="game-over-overlay">
            <h1 className="game-over-title">{t.gameover.title}</h1>
            <div className="final-score">{t.gameover.score}: {score}</div>
            <div style={{color: '#39ff14', fontSize: '1.5rem', marginBottom: '20px', textShadow: '0 0 10px #39ff14'}}>{t.gameover.scrap}: +{runScrap}</div>
            
            <div style={{marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '80px'}}>
                <input 
                    type="text" 
                    placeholder={t.gameover.enterName}
                    value={playerName} 
                    onChange={(e) => setPlayerName(e.target.value)} 
                    maxLength="10"
                    disabled={submitStatus === 'success'} 
                    style={{
                        padding: '10px', 
                        fontSize: '1rem', 
                        marginBottom: '10px', 
                        textAlign: 'center', 
                        background: 'rgba(0,0,0,0.5)', 
                        color: 'white', 
                        border: '1px solid #bc13fe',
                        opacity: submitStatus === 'success' ? 0.5 : 1
                    }}
                />
                
                {!submitStatus ? (
                    <button 
                        className="menu-button" 
                        style={{fontSize: '0.8rem', padding: '5px 20px', borderColor: '#bc13fe', color: '#bc13fe'}} 
                        onClick={submitScore}
                    >
                        {t.gameover.submit}
                    </button>
                ) : (
                    <div style={{
                        color: submitStatus === 'success' ? '#39ff14' : '#ff0055',
                        fontWeight: 'bold',
                        textShadow: submitStatus === 'success' ? '0 0 10px #39ff14' : '0 0 10px #ff0055',
                        animation: 'fadeIn 0.5s'
                    }}>
                        {submitMessage}
                    </div>
                )}
            </div>

            {score >= highScore && score > 0 && <div className="new-record">{t.gameover.newRecord}</div>}
            <button className="menu-button" onClick={handleStartGame}>{t.gameover.retry}</button>
            <button className="menu-button" onClick={handleQuit}>{t.gameover.menu}</button>
        </div>
      )}
      
      {isPlaying && <canvas ref={canvasRef} width={800} height={600} className="game-canvas" />}
    </div>
  );
};
export default SpaceSurvivor;