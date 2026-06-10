/* flow.js — 轻量 SVG 流程图渲染器（配套样式 flow.css）
 * 用法：const f = Flow.render(container, {nodes, edges})
 *  - nodes: [{id, label, sub, x, y, w, accent}]   x/y 为网格坐标（1 格 = 96px），accent 为 CSS 变量名
 *  - edges: [{from, to, label, via:[[x,y],...], anim, accent}]   via 为可选拐点（网格坐标）
 * 颜色全部取页面的 CSS 变量（--line/--blue/--teal/...），自动融入各 lab 配色。
 * 返回 {light(id), flow(from,to,on), reset()} 供步进模拟器联动。
 */
const Flow = (() => {
  const CELL = 96, NH = 52, PAD = 24;

  function px(n, k) { return n[k] * CELL; }
  function nodeBox(n) {
    const w = n.w ? n.w * CELL : 1.6 * CELL;
    return { x: px(n, 'x') - w / 2, y: px(n, 'y') - NH / 2, w, h: NH };
  }
  /* 边在节点边框上的出入点：根据相邻路径点的方向贴到节点边缘 */
  function anchor(n, towards) {
    const b = nodeBox(n), cx = px(n, 'x'), cy = px(n, 'y');
    const dx = towards[0] - cx, dy = towards[1] - cy;
    if (Math.abs(dx) * b.h > Math.abs(dy) * b.w)
      return [cx + Math.sign(dx) * b.w / 2, cy];
    return [cx, cy + Math.sign(dy) * b.h / 2];
  }

  function render(el, def) {
    const ns = 'http://www.w3.org/2000/svg';
    const byId = {};
    def.nodes.forEach(n => byId[n.id] = n);

    let maxX = 0, maxY = 0;
    def.nodes.forEach(n => {
      maxX = Math.max(maxX, px(n, 'x') + (n.w || 1.6) * CELL / 2 + 8);
      maxY = Math.max(maxY, px(n, 'y') + NH / 2 + 8);
    });
    (def.edges || []).forEach(e => (e.via || []).forEach(v => {
      maxX = Math.max(maxX, v[0] * CELL + 8);
      maxY = Math.max(maxY, v[1] * CELL + 20);
    }));

    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `${-PAD} ${-PAD} ${maxX + PAD * 2} ${maxY + PAD * 2}`);
    svg.classList.add('flow');

    const defs = document.createElementNS(ns, 'defs');
    defs.innerHTML = `<marker id="fl-arr" viewBox="0 0 10 10" refX="8" refY="5"
      markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 1 L9 5 L0 9" fill="none" stroke="context-stroke" stroke-width="1.6"/></marker>`;
    svg.appendChild(defs);

    const edgeEls = {};
    (def.edges || []).forEach(e => {
      const a = byId[e.from], b = byId[e.to];
      const pts = (e.via || []).map(v => [v[0] * CELL, v[1] * CELL]);
      const p0 = anchor(a, pts[0] || [px(b, 'x'), px(b, 'y')]);
      const p1 = anchor(b, pts[pts.length - 1] || [px(a, 'x'), px(a, 'y')]);
      const path = [p0, ...pts, p1];
      /* 直角折线 + 拐角小圆弧 */
      let d = `M${path[0]}`;
      const r = 10;
      for (let i = 1; i < path.length - 1; i++) {
        const [x, y] = path[i], [px2, py2] = path[i - 1], [nx, ny] = path[i + 1];
        const u = [Math.sign(x - px2), Math.sign(y - py2)], v = [Math.sign(nx - x), Math.sign(ny - y)];
        d += ` L${x - u[0] * r},${y - u[1] * r} Q${x},${y} ${x + v[0] * r},${y + v[1] * r}`;
      }
      d += ` L${path[path.length - 1]}`;
      const g = document.createElementNS(ns, 'g');
      g.classList.add('fl-edge');
      if (e.accent) g.style.color = `var(--${e.accent})`;
      const p = document.createElementNS(ns, 'path');
      p.setAttribute('d', d);
      p.setAttribute('marker-end', 'url(#fl-arr)');
      if (e.anim) p.classList.add('fl-anim');
      g.appendChild(p);
      if (e.label) {
        const mid = pts[0] || [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
        const t = document.createElementNS(ns, 'text');
        t.setAttribute('x', mid[0]);
        t.setAttribute('y', mid[1] - 9);
        t.textContent = e.label;
        g.appendChild(t);
      }
      svg.appendChild(g);
      edgeEls[e.from + '>' + e.to] = g;
    });

    const nodeEls = {};
    def.nodes.forEach(n => {
      const b = nodeBox(n);
      const g = document.createElementNS(ns, 'g');
      g.classList.add('fl-node');
      if (n.accent) g.style.color = `var(--${n.accent})`;
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', b.x); rect.setAttribute('y', b.y);
      rect.setAttribute('width', b.w); rect.setAttribute('height', b.h);
      rect.setAttribute('rx', 10);
      g.appendChild(rect);
      const t = document.createElementNS(ns, 'text');
      t.classList.add('fl-label');
      t.setAttribute('x', px(n, 'x'));
      t.setAttribute('y', px(n, 'y') + (n.sub ? -3 : 5));
      t.textContent = n.label;
      g.appendChild(t);
      if (n.sub) {
        const s = document.createElementNS(ns, 'text');
        s.classList.add('fl-sub');
        s.setAttribute('x', px(n, 'x'));
        s.setAttribute('y', px(n, 'y') + 15);
        s.textContent = n.sub;
        g.appendChild(s);
      }
      svg.appendChild(g);
      nodeEls[n.id] = g;
    });

    el.appendChild(svg);
    return {
      light(id) {
        Object.entries(nodeEls).forEach(([k, g]) => g.classList.toggle('lit', k === id));
      },
      flow(from, to, on = true) {
        const g = edgeEls[from + '>' + to];
        if (g) g.classList.toggle('on', on);
      },
      reset() {
        Object.values(nodeEls).forEach(g => g.classList.remove('lit'));
        Object.values(edgeEls).forEach(g => g.classList.remove('on'));
      }
    };
  }
  return { render };
})();
