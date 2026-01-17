export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

// Configuração de Preços
export const PRICES = {
  lives: (lvl) => 500 * (lvl + 1),
  // Itens Premium
  autofire: () => 3500,
  magnet: () => 3000,
  ricochet: () => 4000
};

// Estado Inicial dos Upgrades (Apenas os que restaram)
export const INITIAL_UPGRADES = {
  lives: 0,       
  autofire: 0,    
  magnet: 0,      
  ricochet: 0     
};