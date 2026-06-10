/* stepper.js — 共享步进模拟器组件（「下一步 ▸ / 重置 ↺」模式）
 * 用法：const s = Stepper.bind({next, reset, total, onStep, onReset, doneText})
 *  - next / reset: 按钮元素（reset 可省略）
 *  - total: 总步数，可以是数字或函数（步数随状态变化时用函数）
 *  - onStep(i): 第 i 步（0-based）触发时的回调，内容渲染由调用方负责
 *  - onReset(): 重置回调
 *  - doneText: 走完全部步骤后 next 按钮的文案，可以是字符串或函数（默认「完成 ✓」）
 * 返回 {index, reset()}，reset() 供外部（如切换 tab 时）程序化重置。
 */
const Stepper = (() => {
  function bind(o) {
    let i = 0;
    const baseText = o.next.textContent;
    const total = () => typeof o.total === 'function' ? o.total() : o.total;
    o.next.addEventListener('click', () => {
      if (i >= total()) return;
      o.onStep(i++);
      if (i >= total()) {
        o.next.disabled = true;
        o.next.textContent = (typeof o.doneText === 'function' ? o.doneText() : o.doneText) || '完成 ✓';
      }
    });
    function reset() {
      i = 0;
      o.next.disabled = false;
      o.next.textContent = baseText;
      if (o.onReset) o.onReset();
    }
    if (o.reset) o.reset.addEventListener('click', reset);
    return { get index() { return i; }, reset };
  }
  return { bind };
})();
