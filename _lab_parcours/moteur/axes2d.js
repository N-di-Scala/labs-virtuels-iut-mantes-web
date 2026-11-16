/* Axes fléchés des graphiques 2D : flèche dans le sens de lecture, nom de la grandeur et unité.
   LABAX(ctx, gauche, haut, droite, bas, titreX, titreY, options)
   options : xpos "right" | "center" (position du titre de x), xdy (décalage sous l'axe),
             ypos "top" | "inside" (titre de y au-dessus de la flèche ou à sa droite). */
window.LABAX = function (ctx, x0, y0, x1, y1, xl, yl, o) {
  o = o || {};
  const css = getComputedStyle(document.documentElement);
  const col = (css.getPropertyValue("--v2-ink2") || css.getPropertyValue("--ink") || "#8a93a6").trim() || "#8a93a6";
  const ext = 14, hw = 4.5, hl = 9;
  ctx.save();
  ctx.setLineDash([]);
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = 1.4;
  // axe des x : de gauche à droite
  ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x1 + ext - hl, y1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1 + ext, y1); ctx.lineTo(x1 + ext - hl, y1 - hw); ctx.lineTo(x1 + ext - hl, y1 + hw); ctx.closePath(); ctx.fill();
  // axe des y : de bas en haut
  ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0 - ext + hl); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x0, y0 - ext); ctx.lineTo(x0 - hw, y0 - ext + hl); ctx.lineTo(x0 + hw, y0 - ext + hl); ctx.closePath(); ctx.fill();
  ctx.font = "600 12px 'Outfit', system-ui, sans-serif";
  ctx.textBaseline = "alphabetic";
  if (xl) {
    const dy = o.xdy != null ? o.xdy : 34;
    if (o.xpos === "center") { ctx.textAlign = "center"; ctx.fillText(xl + " →", (x0 + x1) / 2, y1 + dy); }
    else { ctx.textAlign = "right"; ctx.fillText(xl + " →", x1 + ext, y1 + dy); }
  }
  if (yl) {
    if (o.ypos === "inside") { ctx.textAlign = "left"; ctx.fillText("↑ " + yl, x0 + 9, y0 - ext + 10); }
    else { ctx.textAlign = "left"; ctx.fillText("↑ " + yl, Math.max(4, x0 - 10), y0 - ext - 6); }
  }
  ctx.restore();
};
