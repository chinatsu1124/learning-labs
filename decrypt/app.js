'use strict';
const $ = id => document.getElementById(id);

/* ============================================================
   1 · 凯撒密码（Hero + 工具 + 暴力破解）
   ============================================================ */
function caesar(text, shift){
  shift = ((shift % 26) + 26) % 26;
  return text.replace(/[a-z]/gi, ch => {
    const base = ch <= 'Z' ? 65 : 97;
    return String.fromCharCode((ch.charCodeAt(0) - base + shift) % 26 + base);
  });
}

// Hero
const heroIn = $('heroIn'), heroShift = $('heroShift');
function renderHero(){
  const s = +heroShift.value;
  $('heroShiftVal').textContent = s;
  $('heroShiftN').textContent = s;
  $('heroOut').textContent = caesar(heroIn.value, s) || '—';
}
heroIn.addEventListener('input', renderHero);
heroShift.addEventListener('input', renderHero);
renderHero();

// 凯撒工具
function renderCaesar(){
  const txt = $('cIn').value;
  let s = parseInt($('cShift').value, 10);
  if (Number.isNaN(s)) s = 0;
  $('cOut').textContent = caesar(txt, s) || '—';
  // 暴力破解：列出全部 25 种位移
  let lines = '破解演示 · 25 种位移全列出，肉眼挑人话：\n';
  for (let k = 1; k <= 25; k++){
    const tag = (k === ((s % 26) + 26) % 26) ? ' ← 当前密钥' : '';
    lines += String(k).padStart(2, '0') + '  ' + caesar(txt, k) + tag + '\n';
  }
  $('cBrute').textContent = lines;
}
['cIn','cShift'].forEach(id => $(id).addEventListener('input', renderCaesar));
renderCaesar();

/* ============================================================
   2 · 维吉尼亚密码（多表替换，逐字母对齐展示）
   ============================================================ */
function renderVigenere(){
  const plain = $('vIn').value.toUpperCase().replace(/[^A-Z]/g, '');
  const key   = $('vKey').value.toUpperCase().replace(/[^A-Z]/g, '');
  const box = $('vRows');
  if (!key){ box.innerHTML = '<span class="r"><span class="lab">密钥</span><span class="k">请输入密钥词</span></span>'; return; }
  let pRow = '', kRow = '', cRow = '';
  for (let i = 0; i < plain.length; i++){
    const p = plain.charCodeAt(i) - 65;
    const kc = key[i % key.length];
    const k = kc.charCodeAt(0) - 65;
    const c = (p + k) % 26;
    pRow += plain[i];
    kRow += kc;
    cRow += String.fromCharCode(c + 65);
  }
  box.innerHTML =
    `<span class="r"><span class="lab">明文</span><span class="p">${pRow || '—'}</span></span>` +
    `<span class="r"><span class="lab">密钥</span><span class="k">${kRow || '—'}</span></span>` +
    `<span class="r"><span class="lab">密文</span><span class="c">${cRow || '—'}</span></span>`;
}
['vIn','vKey'].forEach(id => $(id).addEventListener('input', renderVigenere));
renderVigenere();

/* ============================================================
   3 · AES-GCM（Web Crypto 真实加密，PBKDF2 派生密钥）
   ============================================================ */
const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = str => Uint8Array.from(atob(str), c => c.charCodeAt(0));

async function deriveKey(pass, salt){
  const km = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name:'PBKDF2', salt, iterations:120000, hash:'SHA-256' },
    km, { name:'AES-GCM', length:256 }, false, ['encrypt','decrypt']
  );
}
async function aesEncrypt(){
  try{
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv   = crypto.getRandomValues(new Uint8Array(12));
    const key  = await deriveKey($('aPass').value, salt);
    const ct   = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, enc.encode($('aMsg').value));
    const packed = new Uint8Array(salt.length + iv.length + ct.byteLength);
    packed.set(salt, 0); packed.set(iv, 16); packed.set(new Uint8Array(ct), 28);
    $('aOut').textContent = b64(packed);
    $('aBack').textContent = '— 点击左侧按钮用相同口令解密 —';
    $('aBack').style.color = 'var(--muted)';
  }catch(e){ $('aOut').textContent = '加密出错：' + e.message; }
}
async function aesDecrypt(){
  const back = $('aBack');
  try{
    const packed = unb64($('aOut').textContent.trim());
    const salt = packed.slice(0, 16), iv = packed.slice(16, 28), ct = packed.slice(28);
    const key = await deriveKey($('aPass').value, salt);
    const pt  = await crypto.subtle.decrypt({ name:'AES-GCM', iv }, key, ct);
    back.textContent = dec.decode(pt);
    back.style.color = 'var(--cipher)';
  }catch(e){
    back.textContent = '✗ 解密失败：口令错误，或密文被篡改（GCM 认证拒绝）';
    back.style.color = 'var(--danger)';
  }
}
$('aEnc').addEventListener('click', aesEncrypt);
$('aDec').addEventListener('click', aesDecrypt);
aesEncrypt();

/* ============================================================
   4 · RSA（小素数原理演示，BigInt 模幂）
   ============================================================ */
function isPrime(n){
  if (n < 2n) return false;
  if (n % 2n === 0n) return n === 2n;
  for (let i = 3n; i * i <= n; i += 2n) if (n % i === 0n) return false;
  return true;
}
function modpow(base, exp, mod){
  base %= mod; let r = 1n;
  while (exp > 0n){ if (exp & 1n) r = r * base % mod; exp >>= 1n; base = base * base % mod; }
  return r;
}
function gcd(a, b){ while (b){ [a, b] = [b, a % b]; } return a; }
function modinv(a, m){
  let [old_r, r] = [a, m], [old_s, s] = [1n, 0n];
  while (r){ const q = old_r / r; [old_r, r] = [r, old_r - q * r]; [old_s, s] = [s, old_s - q * s]; }
  return ((old_s % m) + m) % m;
}
function step(n, html){ return `<div class="step"><span class="n">${n}</span><span class="t">${html}</span></div>`; }

function renderRSA(){
  const box = $('rSteps');
  const p = BigInt($('rP').value || 0), q = BigInt($('rQ').value || 0);
  if (!isPrime(p) || !isPrime(q)){
    box.innerHTML = step('!', `<b style="color:var(--danger)">p 和 q 都必须是素数</b>。试试 61、53、17、71 这类。`);
    return;
  }
  if (p === q){ box.innerHTML = step('!', `<b style="color:var(--danger)">p 与 q 不能相同</b>。`); return; }
  const n = p * q, phi = (p - 1n) * (q - 1n);
  let e = 17n;
  while (gcd(e, phi) !== 1n) e += 2n;          // 找与 φ 互素的公钥指数
  const d = modinv(e, phi);                     // 私钥指数
  let m = BigInt($('rM').value || 0);
  let warn = '';
  if (m >= n){ warn = `<br><b style="color:var(--danger)">m 必须小于 n=${n}，已自动取模</b>`; m %= n; }
  const c = modpow(m, e, n);                     // 加密 c = m^e mod n
  const back = modpow(c, d, n);                  // 解密 m = c^d mod n

  box.innerHTML =
    step(1, `选两个素数 <span class="vk">p=${p}</span>、<span class="vk">q=${q}</span>`) +
    step(2, `相乘得模数 <b>n = p·q =</b> <span class="v">${n}</span>　（公开）`) +
    step(3, `欧拉函数 <b>φ(n) = (p−1)(q−1) =</b> <span class="v">${phi}</span>　（保密）`) +
    step(4, `选公钥指数 <b>e =</b> <span class="vk">${e}</span>，满足 gcd(e, φ)=1`) +
    step(5, `求私钥指数 <b>d =</b> <span class="vk">${d}</span>，满足 e·d ≡ 1 (mod φ)`) +
    step('K', `<b>公钥 = (n=${n}, e=${e})</b>　·　<b>私钥 = (n=${n}, d=${d})</b>`) +
    step('E', `加密：<b>c = m<sup>e</sup> mod n = ${m}<sup>${e}</sup> mod ${n} =</b> <span class="v">${c}</span>${warn}`) +
    step('D', `解密：<b>m = c<sup>d</sup> mod n =</b> <span class="v">${back}</span>　${back === m ? '✓ 还原成功' : ''}`);
}
['rP','rQ','rM'].forEach(id => $(id).addEventListener('input', renderRSA));
renderRSA();

/* ============================================================
   5 · SHA-256（Web Crypto 真实哈希 + 雪崩效应）
   ============================================================ */
async function sha256bytes(str){
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(str));
  return new Uint8Array(buf);
}
const toHex = bytes => [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
function popcount(x){ let c = 0; while (x){ c += x & 1; x >>= 1; } return c; }

async function renderHash(){
  const a = await sha256bytes($('hA').value);
  const b = await sha256bytes($('hB').value);
  const hexA = toHex(a), hexB = toHex(b);
  $('hOutA').textContent = hexA;
  // 高亮 B 中与 A 不同的 hex 字符
  let html = '';
  for (let i = 0; i < hexB.length; i++){
    const cls = hexB[i] === hexA[i] ? 'same' : 'diff';
    html += `<span class="${cls}">${hexB[i]}</span>`;
  }
  $('hOutB').innerHTML = html;
  // 二进制位差异（共 256 位）
  let diffBits = 0;
  for (let i = 0; i < 32; i++) diffBits += popcount(a[i] ^ b[i]);
  const pct = (diffBits / 256 * 100);
  $('hFill').style.width = pct + '%';
  $('hPct').textContent = `${diffBits} / 256 位 (${pct.toFixed(1)}%)`;
}
['hA','hB'].forEach(id => $(id).addEventListener('input', renderHash));
renderHash();

/* ============================================================
   6 · Diffie–Hellman（颜色比喻 + 真实模幂数学）
   ============================================================ */
const DH_G = 5n, DH_P = 23n;           // 教学用小参数
const hueColor = v => `hsl(${(Number(v) * 47) % 360} 68% 52%)`;
const BASE_COLOR = 'hsl(192 55% 42%)';

function renderDH(){
  const a = BigInt($('dhA').value || 1), b = BigInt($('dhB').value || 1);
  const A = modpow(DH_G, a, DH_P);       // Alice 公开值
  const B = modpow(DH_G, b, DH_P);       // Bob 公开值
  const sA = modpow(B, a, DH_P);         // Alice 算出的共享
  const sB = modpow(A, b, DH_P);         // Bob 算出的共享

  // 颜色比喻
  $('swABase').style.background = BASE_COLOR;
  $('swBBase').style.background = BASE_COLOR;
  $('swASecret').style.background = hueColor(a);
  $('swBSecret').style.background = hueColor(b);
  $('swAMix').style.background = hueColor(A);
  $('swBMix').style.background = hueColor(B);
  const shared = hueColor(sA);
  $('dhSharedSw').style.background = shared;
  $('dhSharedSw').textContent = `共享密钥 = ${sA}（双方一致）`;

  // 数学步骤
  $('dhSteps').innerHTML =
    step('公', `公开参数：底数 <span class="vk">g=${DH_G}</span>、素数 <span class="vk">p=${DH_P}</span>（窃听者也看得到）`) +
    step('A', `Alice 算公开值 <b>A = g<sup>a</sup> mod p = ${DH_G}<sup>${a}</sup> mod ${DH_P} =</b> <span class="v">${A}</span> → 发给 Bob`) +
    step('B', `Bob 算公开值 <b>B = g<sup>b</sup> mod p = ${DH_G}<sup>${b}</sup> mod ${DH_P} =</b> <span class="v">${B}</span> → 发给 Alice`) +
    step('=', `Alice：<b>B<sup>a</sup> mod p =</b> <span class="v">${sA}</span>　Bob：<b>A<sup>b</sup> mod p =</b> <span class="v">${sB}</span>　${sA === sB ? '<b style="color:var(--cipher)">✓ 相等！</b>' : ''}`) +
    step('!', `窃听者只拿到 g、p、A、B，想反推出 a 或 b 就得解<b>离散对数</b>——大素数下做不到。`);
}
['dhA','dhB'].forEach(id => $(id).addEventListener('input', renderDH));
renderDH();
