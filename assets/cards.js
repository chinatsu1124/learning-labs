/* cards.js — 共享「点击卡片切换详情面板」组件
 * 用法：Cards.render(gridEl, detailEl, items, {cardClass, card, detail, onSelect, initial})
 *  - cardClass: 卡片元素的 class（沿用各页已有样式，如 'pat-card' / 'ctx-block'）
 *  - card(item, i): 返回卡片内部 html
 *  - detail(item, i): 返回详情面板 html（detailEl 为 null 时可省略）
 *  - onSelect(item, el, i): 选中回调（可选，用于联动其他元素）
 *  - initial: 初始选中下标，默认 0；传 -1 则不默认选中
 */
const Cards = (() => {
  function render(gridEl, detailEl, items, o) {
    const cls = o.cardClass || 'card';
    items.forEach((item, i) => {
      const el = document.createElement('button');
      el.className = cls;
      el.innerHTML = o.card(item, i);
      el.addEventListener('click', () => {
        gridEl.querySelectorAll('.' + cls.split(' ')[0]).forEach(x => x.classList.remove('active'));
        el.classList.add('active');
        if (detailEl && o.detail) detailEl.innerHTML = o.detail(item, i);
        if (o.onSelect) o.onSelect(item, el, i);
      });
      gridEl.appendChild(el);
      if (i === (o.initial ?? 0)) el.click();
    });
  }
  return { render };
})();
