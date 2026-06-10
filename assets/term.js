/* term.js — 术语 tooltip，所有 lab 共用。
 * 用法：页面引入本脚本，把术语写成
 *   <span class="term" data-tip="一两句解释" data-name="可选的英文/全称标签">术语</span>
 * 桌面悬停显示，移动端点按显示，点空白或按 Esc 关闭。
 * 对 JS 动态插入的内容同样生效（事件全部委托在 document 上）。 */
(function(){
  var STYLE = [
    '.term{border-bottom:1px dashed rgba(138,169,255,.55);cursor:help;transition:border-color .15s}',
    '.term:hover,.term.tip-on{border-bottom-color:#8aa9ff;border-bottom-style:solid}',
    '#term-tip{position:fixed;z-index:9999;max-width:300px;background:#171a26;color:#c7ccdb;',
    ' border:1px solid #323950;border-radius:10px;padding:10px 14px;font-size:13px;line-height:1.7;',
    ' box-shadow:0 10px 32px rgba(0,0,0,.55);opacity:0;transform:translateY(4px);pointer-events:none;',
    ' transition:opacity .15s ease,transform .15s ease;',
    ' font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif}',
    '#term-tip.show{opacity:1;transform:translateY(0)}',
    '#term-tip .tt-name{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10.5px;',
    ' letter-spacing:.14em;text-transform:uppercase;color:#8aa9ff;margin-bottom:4px}'
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  var tip = null, current = null, pinned = false;

  function ensureTip(){
    if(tip) return tip;
    tip = document.createElement('div');
    tip.id = 'term-tip';
    tip.setAttribute('role','tooltip');
    document.body.appendChild(tip);
    return tip;
  }

  function place(el){
    var r = el.getBoundingClientRect(), t = ensureTip();
    var margin = 8, w = t.offsetWidth, h = t.offsetHeight;
    var x = r.left + r.width/2 - w/2;
    x = Math.max(margin, Math.min(x, window.innerWidth - w - margin));
    var y = r.top - h - 10;            /* 默认在术语上方 */
    if(y < margin) y = r.bottom + 10;  /* 顶部放不下就翻到下方 */
    t.style.left = x + 'px';
    t.style.top  = y + 'px';
  }

  function show(el, pin){
    var t = ensureTip();
    var name = el.getAttribute('data-name');
    t.innerHTML = (name ? '<div class="tt-name"></div>' : '');
    if(name) t.firstChild.textContent = name;
    t.appendChild(document.createTextNode(el.getAttribute('data-tip') || ''));
    if(current && current !== el) current.classList.remove('tip-on');
    current = el; pinned = !!pin;
    el.classList.add('tip-on');
    t.classList.add('show');
    place(el);
  }

  function hide(){
    if(!tip) return;
    tip.classList.remove('show');
    if(current) current.classList.remove('tip-on');
    current = null; pinned = false;
  }

  document.addEventListener('mouseover', function(e){
    var el = e.target.closest && e.target.closest('.term');
    if(el && el !== current) show(el, false);
  });
  document.addEventListener('mouseout', function(e){
    var el = e.target.closest && e.target.closest('.term');
    if(el && el === current && !pinned &&
       !(e.relatedTarget && el.contains(e.relatedTarget))) hide();
  });
  document.addEventListener('click', function(e){
    var el = e.target.closest && e.target.closest('.term');
    if(el){
      e.stopPropagation();
      (el === current && pinned) ? hide() : show(el, true);
    } else hide();
  }, true);
  document.addEventListener('focusin', function(e){
    var el = e.target.closest && e.target.closest('.term');
    if(el) show(el, false);
  });
  document.addEventListener('focusout', function(e){
    var el = e.target.closest && e.target.closest('.term');
    if(el && el === current && !pinned) hide();
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') hide();
  });
  window.addEventListener('scroll', function(){ if(current) place(current); }, true);
  window.addEventListener('resize', function(){ if(current) place(current); });

  /* 键盘可聚焦：初始 + 动态插入的术语都补上 tabindex */
  function focusable(root){
    (root.querySelectorAll ? root.querySelectorAll('.term') : []).forEach(function(el){
      if(!el.hasAttribute('tabindex')) el.setAttribute('tabindex','0');
    });
  }
  function init(){
    focusable(document);
    new MutationObserver(function(){ focusable(document); })
      .observe(document.body, {childList:true, subtree:true});
  }
  (document.readyState === 'loading')
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
