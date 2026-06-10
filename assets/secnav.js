/* secnav.js — 右侧滚动进度导航（共享组件）
 * 自动从页面的 section[id] + .secnum 生成圆点导航：当前章节高亮、hover 显示章节名、点击平滑跳转。
 * 强调色自动取第一个 .secnum 的文字颜色，无需配置；不足 2 个章节或窄屏（<1100px）不显示。
 * 用法：<script defer src="/assets/secnav.js"></script>
 */
(() => {
  function init() {
    const secs = [...document.querySelectorAll('section')]
      .filter(s => s.querySelector('.secnum'));
    if (secs.length < 2) return;
    secs.forEach((s, i) => { if (!s.id) s.id = 'sec-' + (i + 1); });
    const accent = getComputedStyle(secs[0].querySelector('.secnum')).color;

    const style = document.createElement('style');
    style.textContent = `
      .secnav{position:fixed;right:22px;top:50%;transform:translateY(-50%);z-index:5;
        display:flex;flex-direction:column;gap:14px}
      .secnav a{position:relative;display:block;width:8px;height:8px;border-radius:50%;
        background:var(--line,#262a38);transition:all .25s}
      .secnav a:hover{background:var(--muted,#8a90a3)}
      .secnav a.on{background:${accent};box-shadow:0 0 10px ${accent}}
      .secnav a::after{content:attr(data-name);position:absolute;right:18px;top:50%;
        transform:translateY(-50%);font-family:var(--mono,monospace);font-size:11px;letter-spacing:.12em;
        color:var(--muted,#8a90a3);background:var(--panel,#13151f);border:1px solid var(--line,#262a38);
        border-radius:6px;padding:3px 10px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .2s}
      .secnav a:hover::after{opacity:1}
      @media(max-width:1100px){.secnav{display:none}}`;
    document.head.appendChild(style);

    const nav = document.createElement('nav');
    nav.className = 'secnav';
    nav.setAttribute('aria-label', '章节导航');
    secs.forEach(s => {
      const a = document.createElement('a');
      a.href = '#' + s.id;
      a.dataset.name = s.querySelector('.secnum').textContent.trim();
      nav.appendChild(a);
    });
    document.body.appendChild(nav);

    const links = [...nav.children];
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const i = secs.indexOf(e.target);
        links.forEach((a, j) => a.classList.toggle('on', j === i));
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    secs.forEach(s => io.observe(s));
  }
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
