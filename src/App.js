import React from 'react';
import SpaceSurvivor from './SpaceSurvivor';
import SpaceBackground from './SpaceBackground';

function App() {
  return (
    <div className="App">
      {/* 1. O Universo (Fundo) */}
      <SpaceBackground />
      
      {/* 2. O Jogo (Frente) */}
      <SpaceSurvivor />
    </div>
  );
}

export default App;