import React from 'react';
import { PRICES } from '../gameConfig';

const Shop = ({ t, upgrades, totalScrap, buyUpgrade, onClose }) => {
  
  const renderPremiumCard = (key) => {
    const status = upgrades[key]; 
    const price = PRICES[key]();
    // Ícones definidos aqui para limpar o ficheiro principal
    const icons = { autofire: '🔫', magnet: '🧲', ricochet: '↩️' };
    const itemData = t.shop.items[key];
    
    let statusText = t.shop.notOwned;
    let buttonText = `${t.shop.buy} $${price}`;
    let buttonColor = null; let buttonBorder = null; let textColor = null;

    if (status === 1) { 
        statusText = t.shop.statusOff; buttonText = t.shop.equip; 
        buttonColor = 'rgba(255, 255, 0, 0.1)'; buttonBorder = '#ffff00'; textColor = '#ffff00';
    } else if (status === 2) { 
        statusText = t.shop.statusOn; buttonText = t.shop.unequip; 
        buttonColor = '#004400'; buttonBorder = '#39ff14'; textColor = '#39ff14';
    }

    return (
        <div className="shop-card" key={key}>
            <div className="shop-icon">{icons[key]}</div>
            <div className="shop-title">{itemData.title}</div>
            <div className="shop-desc" style={{color: status > 0 ? (status === 2 ? '#39ff14' : '#ffff00') : 'var(--primary)'}}>
               {statusText}
            </div>
            <div className="shop-desc">{itemData.desc}</div>
            <button className="shop-btn" onClick={() => buyUpgrade(key)} disabled={status === 0 && totalScrap < price} style={{ opacity: (status === 0 && totalScrap < price) ? 0.5 : 1, background: buttonColor, borderColor: buttonBorder, color: textColor }}>
               {buttonText}
            </button>
        </div>
    );
  };

  return (
    <div className="menu-overlay hangar-overlay">
       <h2 className="pause-title" style={{color: '#39ff14', borderBottom: '2px solid #39ff14', paddingBottom: '10px', marginBottom: '10px'}}>{t.shop.title}</h2>
       <div style={{marginBottom: '10px', color: '#fff', fontSize: '1.2rem'}}>{t.shop.credits}: <span style={{color: '#39ff14', fontWeight: 'bold'}}>$ {totalScrap}</span></div>
       
       <div className="shop-scroll-container">
          <div className="shop-grid">
              {/* Card de Vidas (Lógica Única) */}
              <div className="shop-card">
                <div className="shop-icon">🛡️</div>
                <div className="shop-title">{t.shop.items.lives.title}</div>
                <div className="shop-desc" style={{color: 'var(--primary)'}}>{t.shop.level} {upgrades.lives}</div>
                <div className="shop-desc">{t.shop.items.lives.desc}</div>
                <button className="shop-btn" onClick={() => buyUpgrade('lives')} disabled={totalScrap < PRICES.lives(upgrades.lives)} style={{ opacity: totalScrap < PRICES.lives(upgrades.lives) ? 0.5 : 1 }}>${PRICES.lives(upgrades.lives)}</button>
              </div>

              {/* Cards Premium */}
              {renderPremiumCard('autofire')}
              {renderPremiumCard('magnet')}
              {renderPremiumCard('ricochet')}
          </div>
       </div>
       <button className="menu-button back-btn" onClick={onClose} style={{marginTop: '15px'}}>{t.shop.back}</button>
    </div>
  );
};

export default Shop;