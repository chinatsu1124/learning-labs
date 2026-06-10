/* quiz.js — 共享随堂测验组件
 * 用法：Quiz.render(listEl, scoreEl, items, {final})
 *  - items: [{q, opts:[...], ans:正确项下标, exp:解析 html}]
 *  - final(correct, total): 全部答完后追加在比分后面的文案（可选）
 * DOM 结构与原各 lab 手写版一致（.quiz-q/.qt/.qn/.quiz-opts/.quiz-exp），样式仍由各页自己的 CSS 控制。
 */
const Quiz = (() => {
  function render(listEl, scoreEl, items, o = {}) {
    let answered = 0, correct = 0;
    items.forEach((item, qi) => {
      const qd = document.createElement('div');
      qd.className = 'quiz-q';
      qd.innerHTML = '<div class="qt"><span class="qn">Q' + (qi + 1) + '</span>' + item.q + '</div>';
      const opts = document.createElement('div');
      opts.className = 'quiz-opts';
      const exp = document.createElement('div');
      exp.className = 'quiz-exp';
      exp.innerHTML = item.exp;
      item.opts.forEach((label, oi) => {
        const b = document.createElement('button');
        b.textContent = String.fromCharCode(65 + oi) + '. ' + label;
        b.addEventListener('click', () => {
          if (qd.dataset.done) return;
          qd.dataset.done = '1';
          answered++;
          if (oi === item.ans) { b.classList.add('right'); correct++; }
          else {
            b.classList.add('wrong');
            opts.children[item.ans].classList.add('right');
          }
          exp.style.display = 'block';
          scoreEl.innerHTML = '得分 <b>' + correct + ' / ' + answered + '</b>' +
            (answered === items.length && o.final ? o.final(correct, items.length) : '');
        });
        opts.appendChild(b);
      });
      qd.appendChild(opts);
      qd.appendChild(exp);
      listEl.appendChild(qd);
    });
  }
  return { render };
})();
