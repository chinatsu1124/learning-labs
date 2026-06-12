/* Data-driven tutorial navigation.
 * Pages opt in with:
 *   <body data-tutorial="tool-use">
 *   <div class="sib-grid" data-tutorial-siblings></div>
 */
(() => {
  const currentId = document.body.dataset.tutorial;
  const siblingTargets = [...document.querySelectorAll('[data-tutorial-siblings]')];
  if (!currentId || !siblingTargets.length) return;

  const esc = s => String(s).replace(/[&<>"]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  })[c]);

  fetch('/agent-lab/tutorials.json')
    .then(r => r.ok ? r.json() : Promise.reject(new Error('tutorial manifest load failed')))
    .then(data => {
      const tutorials = [...(data.tutorials || [])].sort((a, b) => a.order - b.order);
      const siblings = tutorials.filter(t => t.id !== currentId);
      const html = siblings.map(t => (
        '<a class="sib" href="' + esc(t.path) + '">' +
          '<div class="sn">' + esc(t.title) + '</div>' +
          '<div class="sd">' + esc(t.description) + '</div>' +
          '<div class="sl">' + esc(t.label) + ' →</div>' +
        '</a>'
      )).join('');
      siblingTargets.forEach(el => { el.innerHTML = html; });
    })
    .catch(() => {
      siblingTargets.forEach(el => { el.hidden = true; });
    });
})();
