import React from 'react';

const Leaderboard = ({ t, data, isLoading, onClose }) => {
  return (
    <div className="menu-overlay">
        <h2 className="pause-title" style={{color: '#bc13fe', borderBottom: '2px solid #bc13fe', paddingBottom: '10px'}}>{t.leaderboard.title}</h2>
        
        {isLoading ? (
            <div style={{color: 'white', margin: '20px'}}>{t.leaderboard.loading}</div>
        ) : (
            <div className="leaderboard-table" style={{width: '90%', maxHeight: '300px', overflowY: 'auto', marginBottom: '20px'}}>
                <table style={{width: '100%', color: 'white', borderCollapse: 'collapse'}}>
                    <thead>
                        <tr style={{borderBottom: '1px solid #555', color: '#bc13fe'}}>
                            <th style={{textAlign:'left', padding:'5px'}}>{t.leaderboard.rank}</th>
                            <th style={{textAlign:'left', padding:'5px'}}>{t.leaderboard.name}</th>
                            <th style={{textAlign:'right', padding:'5px'}}>{t.leaderboard.score}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((entry, index) => (
                            <tr key={index} style={{borderBottom: '1px solid #222'}}>
                                <td style={{padding:'5px'}}>{index + 1}</td>
                                <td style={{padding:'5px'}}>{entry.name}</td>
                                <td style={{padding:'5px', textAlign:'right', color: '#39ff14'}}>{entry.score}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
        <button className="menu-button back-btn" onClick={onClose}>{t.shop.back}</button>
    </div>
  );
};

export default Leaderboard;