import React from 'react';

const Leaderboard = ({ t, data, isLoading, onClose }) => {
  
  const getRankStyle = (index) => {
    switch (index) {
      case 0: return { color: '#FFD700', icon: '👑', shadow: '0 0 15px #FFD700', bg: 'rgba(255, 215, 0, 0.15)', border: '1px solid #FFD700' }; 
      case 1: return { color: '#C0C0C0', icon: '🥈', shadow: '0 0 10px #C0C0C0', bg: 'rgba(192, 192, 192, 0.1)', border: '1px solid #C0C0C0' }; 
      case 2: return { color: '#CD7F32', icon: '🥉', shadow: '0 0 8px #CD7F32', bg: 'rgba(205, 127, 50, 0.1)', border: '1px solid #CD7F32' }; 
      default: return { color: '#fff', icon: `${index + 1}`, shadow: 'none', bg: 'rgba(255, 255, 255, 0.05)', border: '1px solid transparent' }; 
    }
  };

  return (
    // CONTAINER PAI (Full Screen)
    <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
        
        {/* PAINEL (Full Screen sem margens) */}
        <div style={{
            position: 'relative',
            background: 'rgba(10, 15, 40, 0.98)',
            border: '2px solid #00f0ff',
            boxShadow: 'inset 0 0 50px rgba(0, 240, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            width: '100%', height: '100%',
            boxSizing: 'border-box', borderRadius: '0px',
            padding: '30px', display: 'flex', flexDirection: 'column',
            animation: 'fadeIn 0.3s ease-out'
        }}>
            
            {/* Cabeçalho */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                borderBottom: '2px solid rgba(0, 240, 255, 0.5)', paddingBottom: '15px'
            }}>
                <h2 style={{
                    color: '#00f0ff', margin: 0, textShadow: '0 0 15px #00f0ff',
                    fontSize: '2rem', fontFamily: '"Arial Black", Arial, sans-serif', letterSpacing: '2px'
                }}>
                    {t.leaderboard.title}
                </h2>
                <div style={{fontSize: '2.5rem'}}>🏆</div>
            </div>
            
            {/* Tabela */}
            <div style={{
                flex: 1, overflowY: 'auto', marginTop: '20px', marginBottom: '20px', paddingRight: '10px'
            }}>
                {isLoading ? (
                    <div style={{color: '#00f0ff', textAlign: 'center', marginTop: '100px', fontSize: '1.5rem', animation: 'pulse 1s infinite'}}>
                        {t.leaderboard.loading}
                    </div>
                ) : (
                    <table style={{width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px'}}>
                        <thead>
                            <tr style={{color: '#bc13fe', fontSize: '0.9rem', letterSpacing: '3px', textTransform: 'uppercase'}}>
                                <th style={{textAlign:'center', padding:'10px', width: '60px'}}>{t.leaderboard.rank}</th>
                                <th style={{textAlign:'left', padding:'10px'}}>{t.leaderboard.name}</th>
                                <th style={{textAlign:'right', padding:'10px'}}>{t.leaderboard.score}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((entry, index) => {
                                const style = getRankStyle(index);
                                return (
                                    <tr key={index} style={{
                                        background: style.bg,
                                        border: style.border,
                                        borderRadius: '10px',
                                        boxShadow: index < 3 ? `0 0 15px ${style.bg}` : 'none'
                                    }}>
                                        <td style={{padding:'15px', textAlign:'center', fontSize: '1.8rem', borderTopLeftRadius:'10px', borderBottomLeftRadius:'10px'}}>
                                            {style.icon}
                                        </td>
                                        <td style={{padding:'15px', color: '#fff', fontSize: '1.2rem', fontWeight: index < 3 ? 'bold' : 'normal', textShadow: index === 0 ? style.shadow : 'none'}}>
                                            {entry.name}
                                        </td>
                                        <td style={{padding:'15px', textAlign:'right', color: style.color, fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 'bold', textShadow: style.shadow, borderTopRightRadius:'10px', borderBottomRightRadius:'10px'}}>
                                            {entry.score.toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
            
            <button className="menu-button back-btn" onClick={onClose} style={{
                background: 'rgba(255, 0, 85, 0.2)', border: '2px solid #ff0055',
                color: '#ff0055', width: '100%', padding: '15px', fontSize: '1.2rem',
                fontWeight: 'bold', cursor: 'pointer', transition: '0.3s',
                textShadow: '0 0 10px #ff0055', borderRadius: '10px', marginTop: 'auto'
            }}>
                {t.shop.back}
            </button>
        </div>
    </div>
  );
};

export default Leaderboard;