// Verifica colisão entre dois retângulos
export const checkCollision = (rect1, rect2) => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.height + rect1.y > rect2.y
  );
};

// Desenha polígonos (para os inimigos)
export const drawPolygon = (ctx, x, y, radius, sides, color) => {
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