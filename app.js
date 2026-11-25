// ちいく（Web 版）: スタックチャン知育アプリと同じあそびを、iPhone / iPad の Safari で動かす。
// 声は端末の読み上げ（日本語の声）を使うので、インターネットが無くても話せる。
// 名前などの設定は この端末の中（localStorage）だけに保存する。ページには入れない。
'use strict';

const $app = document.getElementById('app');

// ---------------------------------------------------------------------------
// 設定

const DEFAULTS = { childName: '', family: [], choices: 3, maxNumber: 5, rate: 1.0, pitch: 1.2, voice: '' };
const store = {
  get(k, d) {
    try {
      const v = localStorage.getItem('chiiku.' + k);
      return v === null ? d : JSON.parse(v);
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem('chiiku.' + k, JSON.stringify(v));
    } catch {}
  },
};
const cfg = Object.assign({}, DEFAULTS, store.get('cfg', {}));
const saveCfg = () => store.set('cfg', cfg);

// 使う人。先頭がこども本人で、そのあとに家族など（ホームの「だれ？」で選ぶ）
let currentUser = 0;
function users() {
  const v = [];
  for (const n of [cfg.childName, ...cfg.family]) if (n && !v.includes(n)) v.push(n);
  return v;
}
const userName = () => users()[currentUser] || '';
const kidName = () => userName() || 'きみ';
const numChoices = () => Math.min(3, Math.max(2, cfg.choices | 0));
const maxNumber = () => Math.min(10, Math.max(2, cfg.maxNumber | 0));

// ---------------------------------------------------------------------------
// ことば

const PRAISES = ['やったね！', 'すごいね！', 'せいかい！', 'じょうずだね！', 'よく できたね！'];
const TICKLES = ['くすぐったいよ！', 'えへへ、うれしいな', 'わあい！'];
const TRY_AGAIN = 'おしいね。もういちど やってみよう';
const HINT = 'これだよ。おしてみてね';
const HOW_MANY = 'いくつ あるかな？';
const WHICH_FEEL = 'どんな きもち かな？';
const DONE_STEP = 'できたね！';
const WHICH_ROUTINE = 'どれを する？';
const WHICH_GAME = 'どっちで あそぶ？';
const ROBOT_TURN = 'スタックチャンの ばん';
const WAIT_TURN = 'まってね。いまは スタックチャンの ばん';
const NICE = 'じょうず！';
const ALL_DONE = 'ぜんぶ できたね！ はなまる！';
const TURNS_DONE = 'じゅんばんこ できたね！ はなまる！';
const HOW_FEEL = 'いま どんな きもち？';
const WHO_PLAYS = 'だれが あそぶ？';
const READ_PICK = 'よんで えらんでね';

const greeting = () =>
  userName() ? `こんにちは！ ${userName()}、いっしょに あそぼう！` : 'こんにちは！ いっしょに あそぼう！';
const myTurn = () => `${kidName()}の ばん！`;
const whichIs = (s) => `${s} は どれ？`;
// 読み上げで「は」が「ハ」と読まれないように、声だけ「わ」にする（字は正しく「は」）
const sayWhichIs = (s) => `${s} わ どれ？`;
const countIs = (n) => `${n}こ！`;
const isThis = (s) => `${s} だね！`;

const WORDS = [
  { word: 'りんご', pic: '🍎' },
  { word: 'ばなな', pic: '🍌' },
  { word: 'いちご', pic: '🍓' },
  { word: 'いぬ', pic: '🐶' },
  { word: 'ねこ', pic: '🐱' },
  { word: 'くるま', pic: '🚗' },
  { word: 'でんしゃ', pic: '🚃' },
  { word: 'ぱん', pic: '🍞' },
  { word: 'みず', pic: '💧' },
  { word: 'くつ', pic: '👟' },
  { word: 'おはよう', pic: '🌅' },
  { word: 'ありがとう', pic: '🙇' },
  { word: 'ぞう', pic: '🐘' },
];

const ROUTINES = [
  { name: 'はみがき', pic: '🪥', steps: ['はぶらしを もとう', 'はみがきこを すこし つけよう', 'まえの はを ごしごし', 'おくの はも ごしごし', 'おみずで くちを ゆすごう'] },
  { name: 'てあらい', pic: '🧼', steps: ['おみずで てを ぬらそう', 'せっけんを つけよう', 'てのひらを ごしごし', 'ゆびの あいだも ごしごし', 'おみずで ながそう', 'タオルで ふこう'] },
  { name: 'おきがえ', pic: '👕', steps: ['パジャマの うわぎを ぬごう', 'シャツを きよう', 'パジャマの ズボンを ぬごう', 'ズボンを はこう', 'くつしたを はこう'] },
  { name: 'ねるまえ', pic: '🛏️', steps: ['おもちゃを かたづけよう', 'はを みがこう', 'トイレに いこう', 'パジャマを きよう', 'おふとんに はいろう'] },
];

const COLORS = [
  { name: 'あか', color: '#ff1a1a' },
  { name: 'あお', color: '#1f6bff' },
  { name: 'きいろ', color: '#ffe600' },
  { name: 'みどり', color: '#1fd13a' },
  { name: 'ぴんく', color: '#ff8cc6' },
  { name: 'しろ', color: '#ffffff' },
];
const SHAPES = ['まる', 'さんかく', 'しかく', 'ほし'];

const FEELINGS = [
  { name: 'うれしい', expr: 'happy', explain: 'にこにこ。うれしい かお だね' },
  { name: 'かなしい', expr: 'sad', explain: 'しょんぼり。かなしい かお だね' },
  { name: 'おこってる', expr: 'angry', explain: 'ぷんぷん。おこってる かお だね' },
  { name: 'びっくり', expr: 'surprised', explain: 'わっ！ びっくりした かお だね' },
];
// きもちを つたえる（ことばで言えないとき、顔の絵を押して家族に知らせる）
const TELLINGS = [
  { name: 'うれしい', expr: 'happy', color: 'var(--green)' },
  { name: 'かなしい', expr: 'sad', color: 'var(--blue)' },
  { name: 'おこってる', expr: 'angry', color: 'var(--red)' },
  { name: 'こわい', expr: 'scared', color: 'var(--purple)' },
  { name: 'いたい', expr: 'hurt', color: 'var(--orange)' },
  { name: 'ねむい', expr: 'sleepy', color: 'var(--gray)' },
];
const toldFeeling = (name) => `${kidName()}、${name} んだね。おしえてくれて ありがとう`;

// ---------------------------------------------------------------------------
// 小さな道具

const rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1)); // lo..hi
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// 正解 ans を含む、重ならない n 個
function pickOptions(ans, n, lo, hi) {
  n = Math.min(n, hi - lo + 1);
  const v = [ans];
  while (v.length < n) {
    const r = rand(lo, hi);
    if (!v.includes(r)) v.push(r);
  }
  return shuffle(v);
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function render(html, cls = '') {
  $app.className = cls;
  $app.innerHTML = html;
}

// ボタン（data-b のついたもの）が押されるのを待つ。押されたボタンの data-b、時間切れなら null
let tapResolver = null;
let lastTap = Date.now();
$app.addEventListener('pointerdown', (e) => {
  lastTap = Date.now();
  const b = e.target.closest('[data-b]');
  if (!b || b.disabled) return;
  e.preventDefault();
  sfx.click();
  if (tapResolver) {
    const r = tapResolver;
    tapResolver = null;
    r(b.dataset.b);
  }
});
function waitTap(timeoutMs = 0) {
  return new Promise((res) => {
    tapResolver = res;
    if (timeoutMs)
      setTimeout(() => {
        if (tapResolver === res) {
          tapResolver = null;
          res(null);
        }
      }, timeoutMs);
  });
}

// ---------------------------------------------------------------------------
// 音（ボタンの音・せいかいの音など）

let ac = null;
function audioCtx() {
  if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
  if (ac.state === 'suspended') ac.resume();
  return ac;
}
function tone(freq, start, dur, type = 'sine', vol = 0.25) {
  try {
    const c = audioCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    const t = c.currentTime + start;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  } catch {}
}
const sfx = {
  click: () => tone(1200, 0, 0.05, 'square', 0.05),
  chime: () => (tone(880, 0, 0.3), tone(1318.5, 0.15, 0.5)),
  soft: () => (tone(440, 0, 0.25, 'triangle', 0.2), tone(349, 0.18, 0.35, 'triangle', 0.2)),
  fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.15, i === 3 ? 0.7 : 0.22, 'triangle', 0.25)),
  note: (i) => tone([523, 587, 659, 784, 880][i % 5], 0, 0.4, 'triangle', 0.25),
};

// ---------------------------------------------------------------------------
// 声（端末の読み上げ）。話しているあいだは、画面の顔の口を動かす

let jaVoices = [];
function loadVoices() {
  jaVoices = speechSynthesis.getVoices().filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith('ja'));
}
if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}
const pickVoice = () => jaVoices.find((v) => v.name === cfg.voice) || jaVoices.find((v) => /Kyoko/.test(v.name)) || jaVoices[0] || null;

let speakSeq = 0;
function say(text, spoken) {
  const seq = ++speakSeq;
  const words = spoken || text;
  return new Promise((res) => {
    if (!('speechSynthesis' in window)) return res();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(words);
    u.lang = 'ja-JP';
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = cfg.rate;
    u.pitch = cfg.pitch;
    let done = false;
    // 読み上げの終わりの知らせが来ないことがあるので、長さから見つもった時間でも終える
    const tm = setTimeout(() => finish(), 2500 + ([...words].length * 260) / cfg.rate);
    function finish() {
      if (done) return;
      done = true;
      clearTimeout(tm);
      if (seq === speakSeq) talking(false);
      res();
    }
    u.onend = finish;
    u.onerror = finish;
    talking(true);
    speechSynthesis.speak(u);
  });
}
function stopSay() {
  speakSeq++;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  talking(false);
}

let mouthTimer = null;
function talking(on) {
  clearInterval(mouthTimer);
  mouthTimer = null;
  const set = (m) => document.querySelectorAll('svg.face.live').forEach((el) => (el.innerHTML = faceInner(el.dataset.expr, m)));
  if (on) {
    let ph = 0;
    mouthTimer = setInterval(() => set(0.2 + 0.8 * Math.abs(Math.sin((ph += 0.9))) * (0.5 + Math.random() * 0.5)), 110);
  } else {
    set(0);
  }
}

// ---------------------------------------------------------------------------
// スタックチャンの顔（本体と同じ形）。mouth は口の開き (0..1)

const FG = '#fff';
const CHEEK = '#ff6ab0';
const SWEAT = '#5abaff';
function arcPath(cx, cy, r, a0, a1) {
  const p = (a) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}
function faceInner(e = 'neutral', mouth = 0, blink = false) {
  const cx = 160, cy = 100, ex = 64, ey = cy - 18, er = 16, th = 6;
  const line = (x1, y1, x2, y2, w = th) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${FG}" stroke-width="${w}" stroke-linecap="round"/>`;
  const circ = (x, y, r, fill = FG) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
  const ring = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r - th / 2}" fill="none" stroke="${FG}" stroke-width="${th}"/>`;
  const arc = (x, y, r, a0, a1) => `<path d="${arcPath(x, y, r, a0, a1)}" fill="none" stroke="${FG}" stroke-width="${th}" stroke-linecap="round"/>`;
  let s = '';
  for (const [x, inner] of [[cx - ex, 1], [cx + ex, -1]]) {
    if (blink && (e === 'neutral' || e === 'happy')) {
      s += line(x - er, ey, x + er, ey);
      continue;
    }
    switch (e) {
      case 'happy':
        s += arc(x, ey + er / 2, er - th / 2, 180, 360);
        s += circ(x - inner * 6, cy + 12, 9, CHEEK);
        break;
      case 'sad':
        s += circ(x, ey + 4, er * 0.8) + line(x - inner * er, ey - er - 2, x + inner * er, ey - er - 14, 3);
        break;
      case 'angry':
        s += circ(x, ey + 2, er * 0.8) + line(x - inner * er, ey - er - 14, x + inner * er, ey - er - 2, 3);
        break;
      case 'surprised':
        s += ring(x, ey, er * 1.3) + circ(x, ey, er * 0.5);
        break;
      case 'sleepy':
        s += `<rect x="${x - er}" y="${ey + 2}" width="${er * 2}" height="${th}" fill="${FG}"/>`;
        break;
      case 'scared': // 見ひらいた目と、こまったまゆ
        s += ring(x, ey + 2, er * 1.1) + circ(x, ey + 2, er * 0.4) + line(x - inner * er, ey - er - 2, x + inner * er, ey - er - 14, 3);
        break;
      case 'hurt': { // ぎゅっとつぶった目（> <）
        const tip = x + inner * er * 0.7, out = x - inner * er * 0.7;
        s += line(out, ey - er * 0.7, tip, ey, 5) + line(tip, ey, out, ey + er * 0.7, 5);
        break;
      }
      default:
        s += circ(x, ey, er);
    }
  }
  if (e === 'scared' || e === 'hurt') { // あせ
    const dx = cx + ex + er + 6, dy = ey + 4;
    s += circ(dx, dy, 5, SWEAT) + `<path d="M${dx - 5} ${dy - 1}L${dx + 5} ${dy - 1}L${dx} ${dy - 12}Z" fill="${SWEAT}"/>`;
  }
  const my = cy + 30;
  if (mouth > 0.08) {
    const w = 50, h = 8 + 34 * mouth;
    return s + `<rect x="${cx - w / 2}" y="${my - h / 2}" width="${w}" height="${h}" rx="${Math.min(h / 2, 10)}" fill="${FG}"/>`;
  }
  switch (e) {
    case 'happy': s += arc(cx, my - 18, 27, 20, 160); break;
    case 'sad': s += arc(cx, my + 22, 21, 205, 335); break;
    case 'surprised': s += ring(cx, my + 4, 13); break;
    case 'angry': s += `<rect x="${cx - 22}" y="${my}" width="44" height="${th}" fill="${FG}"/>`; break;
    case 'sleepy': s += `<rect x="${cx - 12}" y="${my}" width="24" height="${th}" fill="${FG}"/>`; break;
    case 'scared': {
      let d = `M${cx - 24} ${my + 5}`;
      for (let k = 1; k <= 4; k++) d += `L${cx - 24 + 12 * k} ${my + (k % 2 ? -5 : 5)}`;
      s += `<path d="${d}" fill="none" stroke="${FG}" stroke-width="${th}" stroke-linecap="round" stroke-linejoin="round"/>`;
      break;
    }
    case 'hurt': s += arc(cx, my + 18, 15, 210, 330); break;
    default: s += `<rect x="${cx - 28}" y="${my - th / 2}" width="56" height="${th}" fill="${FG}"/>`;
  }
  return s;
}
// live: 話しているあいだ口を動かす顔
const face = (expr = 'neutral', live = true) =>
  `<svg class="face${live ? ' live' : ''}" data-expr="${expr}" viewBox="50 28 220 136" role="img" aria-label="スタックチャンの かお">${faceInner(expr)}</svg>`;

// 顔を出して、字幕つきで話す
async function sayFace(text, expr = 'neutral', spoken) {
  render(`<div class="facebox">${face(expr)}</div><div class="cap">${esc(text)}</div>`);
  await say(text, spoken);
}

// ---------------------------------------------------------------------------
// 共通の部品

const topBar = (title) =>
  `<div class="top"><button class="back" data-b="back">もどる</button><button class="title" data-b="title">${esc(title)} <span class="spk">🔊</span></button></div>`;

async function praise(first = '') {
  let p = pick(PRAISES);
  if (userName() && Math.random() < 0.5) p = `${userName()}、${p}`;
  sfx.chime();
  await sayFace(first || p, 'happy', first ? `${first} ${p}` : p);
}

function hanamaru() {
  // うずまきと、まわりの花びら
  let d = '';
  const END = Math.PI * 2 * 2.6;
  for (let t = 0; t <= END; t += 0.08) {
    const r = 6 + (60 * t) / END;
    const x = 120 + Math.cos(t - Math.PI / 2) * r, y = 120 + Math.sin(t - Math.PI / 2) * r;
    d += (t === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
  }
  let petals = '';
  const N = 12;
  for (let k = 0; k <= N * 8; k++) {
    const a = (k / (N * 8)) * Math.PI * 2;
    const r = 88 + 14 * Math.abs(Math.sin((a * N) / 2));
    petals += (k === 0 ? 'M' : 'L') + (120 + Math.cos(a) * r).toFixed(1) + ' ' + (120 + Math.sin(a) * r).toFixed(1);
  }
  return `<svg viewBox="0 0 240 240"><path d="${d}" fill="none" stroke="#e00000" stroke-width="7" stroke-linecap="round"/><path d="${petals}Z" fill="none" stroke="#e00000" stroke-width="7" stroke-linejoin="round"/></svg>`;
}
async function celebrate(text) {
  sfx.fanfare();
  render(`<div class="celebrate" data-b="ok">${hanamaru()}<div class="ctext">${esc(text)}</div></div>`, 'white');
  await say(text);
  await Promise.race([waitTap(), sleep(1500)]);
}

// 問題を出して、正解が押されるまで待つ。2回まちがえたら正解を光らせる。
// もどる なら -1、正解なら まちがえた回数
async function ask({ title, spoken, stimulus = '', choices, full = !stimulus }) {
  let wrong = 0;
  const dimmed = new Set();
  const draw = (hint) => {
    render(
      topBar(title) +
        `<div class="body">${stimulus ? `<div class="stim">${stimulus}</div>` : ''}<div class="choices${full ? ' full' : ''}">` +
        choices
          .map((c, i) => `<button data-b="${i}" class="choice ${c.cls || ''}${hint && c.correct ? ' hint' : ''}${dimmed.has(i) ? ' wrong' : ''}" style="${c.style || ''}">${c.html}</button>`)
          .join('') +
        '</div></div>'
    );
  };
  draw(false);
  say(title, spoken);
  for (;;) {
    const b = await waitTap(180000);
    if (b === null || b === 'back') {
      stopSay();
      return -1;
    }
    if (b === 'title') {
      say(title, spoken);
      continue;
    }
    const i = +b;
    if (choices[i].correct) return wrong;
    wrong++;
    dimmed.add(i);
    sfx.soft();
    draw(wrong >= 2);
    await say(wrong >= 2 ? HINT : TRY_AGAIN);
  }
}

async function chooseOne(question, items) {
  render(
    topBar(question) +
      `<div class="body"><div class="choices full">${items
        .map((it, i) => `<button data-b="${i}" class="choice" style="background:${it.color}">${it.pic ? `<span class="emoji" style="font-size:0.9em">${it.pic}</span>` : ''}${esc(it.label)}</button>`)
        .join('')}</div></div>`
  );
  say(question);
  for (;;) {
    const b = await waitTap(120000);
    if (b === 'title') {
      say(question);
      continue;
    }
    stopSay();
    return b === null || b === 'back' ? -1 : +b;
  }
}

// ---------------------------------------------------------------------------
// ことば

async function runKotoba() {
  const mode = await chooseOne(WHICH_GAME, [
    { label: 'えで えらぶ', color: 'var(--red)' },
    { label: 'よんで えらぶ', color: 'var(--blue)' },
  ]);
  if (mode < 0) return;
  for (let round = 0; round < 5; round++) {
    const ans = rand(0, WORDS.length - 1);
    const opts = pickOptions(ans, numChoices(), 0, WORDS.length - 1);
    const w = WORDS[ans];
    let r;
    if (mode === 0) {
      // 聞いて、絵をえらぶ
      r = await ask({
        title: whichIs(w.word),
        spoken: sayWhichIs(w.word),
        choices: opts.map((o) => ({ html: `<span class="emoji">${WORDS[o].pic}</span>`, cls: 'pic', correct: o === ans })),
      });
    } else {
      // 字を読んで、絵をえらぶ（ことばは声に出さない）
      r = await ask({
        title: READ_PICK,
        stimulus: `<div class="big">${esc(w.word)}</div>`,
        choices: opts.map((o) => ({ html: `<span class="emoji">${WORDS[o].pic}</span>`, cls: 'pic', correct: o === ans })),
      });
    }
    if (r < 0) return;
    sfx.chime();
    render(`<div class="facebox"><span class="emoji" style="font-size:min(50vmin,320px)">${w.pic}</span></div><div class="cap" style="color:#fff;font-size:min(14vmin,140px)">${esc(w.word)}</div>`);
    await say(w.word);
    await praise();
  }
  await celebrate(ALL_DONE);
}

// ---------------------------------------------------------------------------
// かず

async function runKazu() {
  const items = ['🍎', '🍓', '🐶', '🚗', '⭐', '🍌', '🐱'];
  for (let round = 0; round < 5; round++) {
    const n = rand(1, maxNumber());
    const it = pick(items);
    const cols = n <= 5 ? n : Math.ceil(n / 2);
    const stim = `<div class="dots" style="--cols:${cols};--rows:${Math.ceil(n / cols)};--size:${n <= 3 ? 22 : n <= 5 ? 16 : 12}vmin">${`<span>${it}</span>`.repeat(n)}</div>`;
    const opts = pickOptions(n, numChoices(), 1, maxNumber());
    const r = await ask({
      title: HOW_MANY,
      stimulus: stim,
      choices: opts.map((o) => ({ html: String(o), cls: 'num', correct: o === n })),
    });
    if (r < 0) return;
    await praise(countIs(n));
  }
  await celebrate(ALL_DONE);
}

// ---------------------------------------------------------------------------
// いろ・かたち

function shapeSvg(i, color = 'var(--accent)') {
  const shapes = [
    '<circle cx="50" cy="50" r="42"/>',
    '<polygon points="50,8 94,88 6,88"/>',
    '<rect x="10" y="10" width="80" height="80"/>',
    `<polygon points="${Array.from({ length: 10 }, (_, k) => {
      const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 19 : 46;
      return (50 + Math.cos(a) * r).toFixed(1) + ',' + (52 + Math.sin(a) * r).toFixed(1);
    }).join(' ')}"/>`,
  ];
  return `<svg viewBox="0 0 100 100" style="width:70%;height:70%;fill:${color}">${shapes[i]}</svg>`;
}

async function runIroKatachi() {
  const mode = await chooseOne(WHICH_GAME, [
    { label: 'いろ', color: 'var(--red)' },
    { label: 'かたち', color: 'var(--purple)' },
  ]);
  if (mode < 0) return;
  const list = mode === 0 ? COLORS.map((c) => c.name) : SHAPES;
  for (let round = 0; round < 5; round++) {
    const ans = rand(0, list.length - 1);
    const opts = pickOptions(ans, numChoices(), 0, list.length - 1);
    const r = await ask({
      title: whichIs(list[ans]),
      spoken: sayWhichIs(list[ans]),
      choices: opts.map((o) =>
        mode === 0
          ? { html: '', style: `background:${COLORS[o].color}`, correct: o === ans }
          : { html: shapeSvg(o), cls: 'pic', correct: o === ans }
      ),
    });
    if (r < 0) return;
    await praise(isThis(list[ans]));
  }
  await celebrate(ALL_DONE);
}

// ---------------------------------------------------------------------------
// せいかつ（手順をひとつずつ）

async function runSeikatsu() {
  const i = await chooseOne(WHICH_ROUTINE, ROUTINES.map((r, k) => ({ label: r.name, pic: r.pic, color: ['var(--blue)', 'var(--green)', 'var(--purple)', 'var(--orange)'][k] })));
  if (i < 0) return;
  const rt = ROUTINES[i];
  for (let s = 0; s < rt.steps.length; s++) {
    const dots = rt.steps.map((_, k) => `<i class="${k < s ? 'done' : k === s ? 'now' : ''}"></i>`).join('');
    render(
      topBar(rt.name) +
        `<div class="step-dots">${dots}</div><div class="facebox" style="flex-direction:column"><span class="emoji" style="font-size:min(26vmin,220px)">${rt.pic}</span><div class="step-text">${esc(rt.steps[s])}</div></div><button class="donebtn" data-b="done">できた！</button>`
    );
    say(rt.steps[s]);
    for (;;) {
      const b = await waitTap(300000);
      if (b === 'title') {
        say(rt.steps[s]);
        continue;
      }
      if (b !== 'done') {
        stopSay();
        return;
      }
      break;
    }
    sfx.chime();
    await sayFace(DONE_STEP, 'happy');
  }
  await celebrate(ALL_DONE);
}

// ---------------------------------------------------------------------------
// きもち

async function runFeelingQuiz() {
  for (let round = 0; round < 5; round++) {
    const ans = rand(0, FEELINGS.length - 1);
    const opts = pickOptions(ans, numChoices(), 0, FEELINGS.length - 1);
    const f = FEELINGS[ans];
    const r = await ask({
      title: WHICH_FEEL,
      stimulus: face(f.expr, false),
      choices: opts.map((o) => ({ html: FEELINGS[o].name, style: 'background:var(--orange);font-size:min(8vmin,72px)', correct: o === ans })),
    });
    if (r < 0) return;
    await praise();
    await sayFace(f.explain, f.expr);
  }
  await celebrate(ALL_DONE);
}

// じゅんばんこ（順番をまつ練習）
async function runTurns() {
  for (let round = 0; round < 4; round++) {
    render(topBar(myTurn()) + `<div class="body"><div class="choices full"><button class="choice" data-b="pon" style="background:var(--accent);color:#000;font-size:min(16vmin,160px)">ぽん！</button></div></div>`);
    say(myTurn());
    let b;
    while ((b = await waitTap(180000)) === 'title') say(myTurn());
    if (b !== 'pon') {
      stopSay();
      return;
    }
    sfx.note(round * 2);
    render(topBar(NICE) + `<div class="body"><div class="stim" style="background:none">${shapeSvg(3)}</div></div>`);
    await say(NICE);

    // スタックチャンの番。そのあいだに押したら「まってね」
    render(`<div class="facebox" data-b="wait">${face('happy')}</div><div class="cap" data-b="wait">${ROBOT_TURN}</div>`);
    await say(ROBOT_TURN);
    sfx.note(round * 2 + 1);
    const pressed = await Promise.race([waitTap().then(() => true), sleep(1500).then(() => false)]);
    tapResolver = null;
    if (pressed) {
      sfx.soft();
      await sayFace(WAIT_TURN, 'neutral');
    }
  }
  await celebrate(TURNS_DONE);
}

async function runKimochi() {
  const i = await chooseOne(WHICH_GAME, [
    { label: 'きもち クイズ', color: 'var(--orange)' },
    { label: 'じゅんばんこ', color: 'var(--purple)' },
  ]);
  if (i === 0) await runFeelingQuiz();
  if (i === 1) await runTurns();
}

// 押した気持ちを、顔と大きな字と声で知らせる。おとなが「わかったよ」を押すまで出しておく
async function showFeeling(t) {
  const said = toldFeeling(t.name);
  render(`<div class="facebox" data-b="again" style="flex-direction:column">${face(t.expr)}<div class="feel-name">${t.name}</div></div><button class="okbtn" data-b="ok">わかったよ</button>`);
  sfx.chime(); // まわりの家族に気づいてもらう
  await sleep(500);
  say(said);
  while ((await waitTap(10 * 60 * 1000)) === 'again') say(said);
  stopSay();
}

async function runTellFeeling() {
  render(
    topBar(HOW_FEEL) +
      `<div class="feel-grid">${TELLINGS.map((t, i) => `<button data-b="${i}" style="background:${t.color}">${face(t.expr, false)}${t.name}</button>`).join('')}</div>`
  );
  say(HOW_FEEL);
  let b;
  while ((b = await waitTap(90000)) === 'title') say(HOW_FEEL);
  stopSay();
  if (b !== null && b !== 'back') await showFeeling(TELLINGS[+b]);
}

// ---------------------------------------------------------------------------
// いろまぜ: 絵の具をえらんで、おわんの中でまぜると何色になるかを見る

const PAINTS = [
  { name: 'あか', color: '#ff1a1a', text: '#fff' },
  { name: 'あお', color: '#1f6bff', text: '#fff' },
  { name: 'きいろ', color: '#ffe600', text: '#000' },
  { name: 'しろ', color: '#ffffff', text: '#000' },
];
const ALL = 0b1111;
// まぜた絵の具の組み合わせ（ビット: あか=1, あお=2, きいろ=4, しろ=8）と、できる色（絵の具をまぜたときの色）
const MIXES = [
  { mask: 0b0101, name: 'オレンジ', color: '#ffa400' },
  { mask: 0b0011, name: 'むらさき', color: '#9400c8' },
  { mask: 0b0110, name: 'みどり', color: '#00a800' },
  { mask: 0b1001, name: 'ピンク', color: '#ff96bd' },
  { mask: 0b1010, name: 'みずいろ', color: '#7bcaff' },
  { mask: 0b1100, name: 'クリームいろ', color: '#fff6ad' },
  { mask: 0b0111, name: 'くろ', color: '#000000' },
  { mask: 0b1011, name: 'うすむらさき', color: '#bd82ff' },
  { mask: 0b1101, name: 'うすオレンジ', color: '#ffbe8c' },
  { mask: 0b1110, name: 'きみどり', color: '#a5e663' },
  { mask: ALL, name: 'はいいろ', color: '#9c9c9c' }, // ぜんぶまぜたら はいいろ
];
const PICK_PAINT = 'いろを 2つ えらんでね';
const MORE_PAINT = 'もっと いれても いいよ。おわんを さわると まぜるよ';
const CHANT = 'まぜたら まぜたら なにいろ かな？';

const paintsOf = (mask) => PAINTS.map((_, i) => i).filter((i) => mask & (1 << i));
const listText = (mask) => paintsOf(mask).map((i) => PAINTS[i].name).join('と ');
const resultText = (m) => (m.mask === ALL ? `ぜんぶ まぜたら ${m.name}！` : `${listText(m.mask)}で ${m.name}！`);
const quizText = (m) => `${listText(m.mask)}を まぜたら なにいろ？`;
const findMix = (mask) => MIXES.find((m) => m.mask === mask);

// まぜる前の、しまもようのおわん
function stripes(mask) {
  const ps = paintsOf(mask);
  if (!ps.length) return 'var(--tile)';
  const step = 360 / ps.length;
  return `conic-gradient(${ps.map((p, k) => `${PAINTS[p].color} ${k * step}deg ${(k + 1) * step}deg`).join(',')})`;
}

async function mixAnimation(mask) {
  const bowl = document.querySelector('.bowl');
  const fill = bowl.querySelector('.fill');
  const m = findMix(mask);
  bowl.classList.add('mixing');
  say(CHANT);
  await sleep(700);
  fill.style.background = m.color;
  await sleep(1300);
  bowl.classList.remove('mixing');
  return m;
}

async function runIromazeFree() {
  let mask = 0;
  let mixed = null; // まぜたあとの色（つぎに絵の具を押すと、新しくはじめる）
  for (;;) {
    const n = paintsOf(mask).length;
    const title = mixed ? 'もういちど あそぼう' : n < 2 ? PICK_PAINT : 'おわんを さわってね';
    render(
      topBar(title) +
        `<div class="mix"><div class="bowl-wrap"><div class="bowl" data-b="bowl"><div class="fill" style="background:${mixed ? mixed.color : stripes(mask)}"></div></div><div class="bowl-name">${mixed ? mixed.name : ''}</div></div>` +
        `<div class="paints">${PAINTS.map((p, i) => `<button data-b="p${i}" class="${!mixed && mask & (1 << i) ? 'in' : ''}" style="background:${p.color};color:${p.text}">${p.name}</button>`).join('')}</div></div>`
    );
    const b = await waitTap(180000);
    if (b === null || b === 'back') return stopSay();
    if (b === 'title') {
      say(mixed ? resultText(mixed) : n < 2 ? PICK_PAINT : MORE_PAINT);
      continue;
    }
    if (b === 'bowl') {
      if (mixed) say(resultText(mixed));
      else if (n < 2) say(PICK_PAINT);
      else {
        mixed = await mixAnimation(mask);
        sfx.chime();
        say(resultText(mixed)); // 話しているあいだも、つぎのボタンは押せる
      }
      continue;
    }
    if (mixed) {
      mixed = null;
      mask = 0;
    }
    const p = +b.slice(1);
    mask ^= 1 << p;
    if (mask & (1 << p)) say(paintsOf(mask).length === 2 ? `${PAINTS[p].name}。${MORE_PAINT}` : PAINTS[p].name);
  }
}

async function runIromazeQuiz() {
  const order = shuffle(MIXES.map((_, i) => i));
  for (let round = 0; round < 5; round++) {
    const ans = order[round];
    const m = MIXES[ans];
    const opts = pickOptions(ans, numChoices(), 0, MIXES.length - 1);
    const r = await ask({
      title: quizText(m),
      stimulus: `<div class="bowl" style="width:min(60%,40vh)"><div class="fill" style="background:${stripes(m.mask)}"></div></div>`,
      choices: opts.map((o) => ({ html: `<span class="swatch" style="background:${MIXES[o].color}"></span>${MIXES[o].name}`, cls: 'swatchbtn', correct: o === ans })),
    });
    if (r < 0) return;
    render(`<div class="mix"><div class="bowl-wrap"><div class="bowl"><div class="fill" style="background:${stripes(m.mask)}"></div></div><div class="bowl-name"></div></div></div>`);
    await mixAnimation(m.mask);
    document.querySelector('.bowl-name').textContent = m.name;
    sfx.chime();
    await say(resultText(m));
    await praise();
  }
  await celebrate(ALL_DONE);
}

async function runIromaze() {
  const i = await chooseOne(WHICH_GAME, [
    { label: 'じゆうに まぜる', color: 'var(--pink)' },
    { label: 'なにいろ クイズ', color: 'var(--teal)' },
  ]);
  if (i === 0) await runIromazeFree();
  if (i === 1) await runIromazeQuiz();
}

// ---------------------------------------------------------------------------
// パズル: 絵を 2×2 / 3×3 にわけて、さわって入れかえる。合っているピースは緑のわくで動かない

// 絵文字を大きく描いた絵を作る（画面に何度も書かないよう、短い URL にする）
function puzzleImage(w) {
  const c = document.createElement('canvas');
  c.width = c.height = 600;
  const g = c.getContext('2d');
  const hue = rand(0, 359);
  const grad = g.createLinearGradient(0, 0, 600, 600);
  grad.addColorStop(0, `hsl(${hue},80%,70%)`);
  grad.addColorStop(1, `hsl(${(hue + 60) % 360},80%,55%)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 600, 600);
  g.font = '400px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(w.pic, 300, 330);
  return new Promise((res) => c.toBlob((b) => res(URL.createObjectURL(b)), 'image/png'));
}

async function runPuzzleOnce(N, w) {
  const img = await puzzleImage(w);
  const cells = N * N;
  let arr;
  do arr = shuffle([...Array(cells).keys()]);
  while (arr.every((v, i) => v === i));
  let sel = -1;
  const title = 'えを そろえよう';
  for (;;) {
    const board = arr
      .map((piece, pos) => {
        const px = (piece % N) * (100 / (N - 1)), py = Math.floor(piece / N) * (100 / (N - 1));
        const cls = piece === pos ? ' ok' : pos === sel ? ' sel' : '';
        return `<div class="piece${cls}" data-b="${pos}" style="background-image:url(${img});background-size:${N * 100}% ${N * 100}%;background-position:${px}% ${py}%"></div>`;
      })
      .join('');
    render(
      topBar(title) +
        `<div class="puzzle"><div class="board" style="grid-template-columns:repeat(${N},1fr)">${board}</div><div><div class="ref" style="background-image:url(${img})"></div><div class="ref-label">おてほん</div></div></div>`
    );
    if (arr.every((v, i) => v === i)) break;
    const b = await waitTap(300000);
    if (b === null || b === 'back') {
      URL.revokeObjectURL(img);
      return false;
    }
    if (b === 'title') {
      say('さわって いれかえてね');
      continue;
    }
    const pos = +b;
    if (arr[pos] === pos) continue; // 合っているピースは動かさない
    if (sel < 0) {
      sel = pos;
    } else if (sel === pos) {
      sel = -1;
    } else {
      [arr[sel], arr[pos]] = [arr[pos], arr[sel]];
      if (arr[pos] === pos || arr[sel] === sel) sfx.note(rand(0, 4));
      sel = -1;
    }
  }
  sfx.chime();
  await sleep(600);
  await say(`${w.word}！`);
  URL.revokeObjectURL(img);
  return true;
}

async function runPuzzle() {
  const i = await chooseOne(WHICH_GAME, [
    { label: '2×2（4まい）', color: 'var(--teal)' },
    { label: '3×3（9まい）', color: 'var(--purple)' },
  ]);
  if (i < 0) return;
  const N = i === 0 ? 2 : 3;
  const order = shuffle([...WORDS]);
  for (let round = 0; round < 3; round++) {
    if (!(await runPuzzleOnce(N, order[round]))) return;
    await praise();
  }
  await celebrate(ALL_DONE);
}

// ---------------------------------------------------------------------------
// メニュー

const GAMES = [
  { name: 'ことば', pic: '🔤', color: 'var(--red)', run: runKotoba },
  { name: 'かず', pic: '🔢', color: 'var(--blue)', run: runKazu },
  { name: 'いろ・かたち', pic: '🔺', color: 'var(--purple)', run: runIroKatachi },
  { name: 'せいかつ', pic: '🪥', color: 'var(--green)', run: runSeikatsu },
  { name: 'きもち', pic: '😊', color: 'var(--orange)', run: runKimochi },
  { name: 'いろまぜ', pic: '🎨', color: 'var(--pink)', run: runIromaze },
  { name: 'パズル', pic: '🧩', color: 'var(--teal)', run: runPuzzle },
];

async function runMenu() {
  for (;;) {
    render(
      `<div class="tiles">${GAMES.map((g, i) => `<button data-b="${i}" style="background:${g.color}"><span class="emoji">${g.pic}</span>${g.name}</button>`).join('')}<button data-b="back" style="background:var(--gray)">もどる</button></div>`
    );
    const b = await waitTap(180000);
    if (b === null || b === 'back') return;
    const g = GAMES[+b];
    say(g.name);
    await g.run();
    stopSay();
  }
}

// だれが あそぶ？（使う人を切りかえて、呼び方を変える）
async function runChooseUser() {
  const u = users();
  const colors = ['var(--blue)', 'var(--green)', 'var(--purple)', 'var(--orange)', 'var(--red)', 'var(--teal)'];
  const i = await chooseOne(WHO_PLAYS, u.slice(0, 6).map((n, k) => ({ label: n, color: colors[k] })));
  if (i < 0) return;
  currentUser = i;
  render(homeHtml(false));
  await say(greeting());
}

// ---------------------------------------------------------------------------
// 設定（ホームの左上の歯車を3秒長押しする。おとな用）

async function runSettings() {
  const draft = { ...cfg, family: [...cfg.family] };
  for (;;) {
    const voiceOpts = jaVoices.map((v) => `<option value="${esc(v.name)}"${v.name === (pickVoice() || {}).name ? ' selected' : ''}>${esc(v.name)}</option>`).join('');
    render(
      topBar('せってい') +
        `<div class="settings">
          <label for="child">こどもの なまえ（よびかた）</label>
          <input id="child" type="text" value="${esc(draft.childName)}" placeholder="れい: はなちゃん">
          <label for="family">ほかに つかう人（カンマ「,」で くぎる）</label>
          <input id="family" type="text" value="${esc(draft.family.join(','))}" placeholder="れい: パパ,ママ">
          <p class="note">ふたり以上いると、ホームの上に名前が出て、さわると切りかえられます。3分さわらないと、こどもの名前にもどります。</p>
          <label>こたえの かず</label>
          <div class="seg">${[2, 3].map((n) => `<button data-b="choices${n}" class="${draft.choices === n ? 'on' : ''}">${n}こ</button>`).join('')}</div>
          <label>かずあそびの いちばん大きい かず</label>
          <div class="seg">${[3, 5, 10].map((n) => `<button data-b="max${n}" class="${draft.maxNumber === n ? 'on' : ''}">${n}</button>`).join('')}</div>
          <label for="rate">こえの はやさ</label>
          <input id="rate" type="range" min="0.6" max="1.4" step="0.05" value="${draft.rate}">
          <label for="pitch">こえの たかさ</label>
          <input id="pitch" type="range" min="0.6" max="1.8" step="0.05" value="${draft.pitch}">
          <label for="voice">こえの しゅるい</label>
          <select id="voice">${voiceOpts || '<option>（日本語の声が見つかりません）</option>'}</select>
          <p class="note">iPhone の「設定」→「アクセシビリティ」→「読み上げコンテンツ」→「声」→「日本語」で、きれいな声（拡張）をダウンロードすると、ここで選べます。<br>
          マナーモード（消音）だと、ボタンの音が鳴らないことがあります。</p>
          <div class="row"><button data-b="test" style="background:var(--teal)">こえを ためす</button></div>
          <div class="row"><button data-b="save" style="background:var(--green)">ほぞん</button><button data-b="back" style="background:var(--gray)">やめる</button></div>
        </div>`
    );
    const read = () => {
      draft.childName = document.getElementById('child').value.trim();
      draft.family = document.getElementById('family').value.split(/[,、，]/).map((s) => s.trim()).filter(Boolean);
      draft.rate = +document.getElementById('rate').value;
      draft.pitch = +document.getElementById('pitch').value;
      const v = document.getElementById('voice');
      if (jaVoices.length) draft.voice = v.value;
    };
    const b = await waitTap();
    if (b === 'back' || b === null) return;
    read();
    if (b.startsWith('choices')) draft.choices = +b.slice(7);
    else if (b.startsWith('max')) draft.maxNumber = +b.slice(3);
    else if (b === 'test') {
      const keep = { ...cfg };
      Object.assign(cfg, draft);
      await say('このくらいの こえで はなすね');
      Object.assign(cfg, keep);
    } else if (b === 'save') {
      Object.assign(cfg, draft);
      saveCfg();
      currentUser = 0;
      return;
    }
  }
}

// ---------------------------------------------------------------------------
// ホーム

function homeHtml(blink) {
  const u = users();
  return (
    `<div class="home-top"><svg class="gear" id="gear" viewBox="0 0 48 48" aria-label="せってい（3びょう ながおし）">${gearSvg(0)}</svg>` +
    (u.length >= 2 ? `<button class="who" data-b="who">${esc(userName())}</button>` : '') +
    `</div><div class="facebox" data-b="face"><svg class="face live" id="homeface" data-expr="neutral" viewBox="50 28 220 136">${faceInner('neutral', 0, blink)}</svg></div>` +
    `<div class="home-btns"><button data-b="feel" style="background:var(--orange)">きもち</button><button data-b="play" style="background:var(--green)">あそぶ</button></div>`
  );
}
function gearSvg(progress) {
  let s = '';
  for (let k = 0; k < 8; k++) {
    const a = (k * 45 * Math.PI) / 180;
    s += `<circle cx="${24 + Math.cos(a) * 11}" cy="${24 + Math.sin(a) * 11}" r="4" fill="#777"/>`;
  }
  s += '<circle cx="24" cy="24" r="10" fill="#777"/><circle cx="24" cy="24" r="4" fill="#000"/>';
  if (progress > 0) {
    const c = 2 * Math.PI * 20;
    s += `<circle cx="24" cy="24" r="20" fill="none" stroke="#ffe600" stroke-width="4" stroke-dasharray="${c * progress} ${c}" transform="rotate(-90 24 24)"/>`;
  }
  return s;
}

// 歯車を3秒長押しすると設定（子どもがたまたま開かないように）
function watchGear() {
  const g = document.getElementById('gear');
  if (!g) return;
  let t0 = 0, timer = null;
  const stop = () => {
    clearInterval(timer);
    timer = null;
    g.innerHTML = gearSvg(0);
  };
  g.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    t0 = Date.now();
    timer = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / 3000);
      g.innerHTML = gearSvg(p);
      if (p >= 1) {
        stop();
        if (tapResolver) {
          const r = tapResolver;
          tapResolver = null;
          r('settings');
        }
      }
    }, 50);
  });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) g.addEventListener(ev, stop);
}

let blinkTimer = null;
function startBlink() {
  clearTimeout(blinkTimer);
  const loop = () => {
    blinkTimer = setTimeout(() => {
      const f = document.getElementById('homeface');
      if (f && !mouthTimer) {
        f.innerHTML = faceInner('neutral', 0, true);
        setTimeout(() => {
          if (!mouthTimer && document.getElementById('homeface') === f) f.innerHTML = faceInner('neutral', 0, false);
        }, 150);
      }
      loop();
    }, 3000 + Math.random() * 3000);
  };
  loop();
}

const IDLE_MS = 3 * 60 * 1000;

async function home(greet) {
  for (;;) {
    render(homeHtml(false));
    watchGear();
    startBlink();
    if (greet) say(greeting()); // あいさつのあいだも、ボタンは押せる
    greet = false;
    const b = await waitTap(IDLE_MS);
    clearTimeout(blinkTimer);
    if (b === null) {
      if (Date.now() - lastTap >= IDLE_MS) currentUser = 0; // しばらくさわらないと、こども本人にもどる
      continue;
    }
    if (b === 'face') {
      const f = document.getElementById('homeface');
      f.dataset.expr = 'happy';
      f.innerHTML = faceInner('happy');
      await say(pick(TICKLES));
    } else if (b === 'feel') await runTellFeeling();
    else if (b === 'play') await runMenu();
    else if (b === 'who') await runChooseUser();
    else if (b === 'settings') await runSettings();
    stopSay();
  }
}

// 画面が消えないようにする（使える端末だけ）
let wakeLock = null;
async function keepAwake() {
  try {
    if ('wakeLock' in navigator && document.visibilityState === 'visible') wakeLock = await navigator.wakeLock.request('screen');
  } catch {}
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') keepAwake();
});

// 音を出すには、さいしょに一度さわってもらう必要がある（iPhone のきまり）
async function start() {
  render(
    `<div class="start">${face('happy', false)}<button id="start">はじめる</button><p class="note">音が出ます。音量を上げてください。</p></div>`
  );
  // iPhone は「さわって はなした」とき（click）でないと音を出させてくれない
  await new Promise((res) => document.getElementById('start').addEventListener('click', res, { once: true }));
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback'; // マナーモードでも音を出す（対応している端末だけ）
  } catch {}
  audioCtx();
  tone(1, 0, 0.01, 'sine', 0.0002);
  if ('speechSynthesis' in window) speechSynthesis.speak(new SpeechSynthesisUtterance(' '));
  loadVoices();
  keepAwake();
  home(true);
}

start();
