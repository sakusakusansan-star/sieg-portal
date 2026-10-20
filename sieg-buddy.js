/* ═══════════════════════════════════════════════════════════════
   sieg-buddy.js — ホームのあいさつの横にいる小さなキャラ（ぼのぼの）

   ※ キャラは ぼのぼの（© いがらしみきお）。そのまま使う許可を得た絵を、
     描き変えずに部品（体・手と貝・左足・右足・しっぽ）に切り分けて buddy/ に置き、
     部品ごとに動かしている。止まっているときは元の絵とまったく同じに見える。
     部品は作業用スクリプトで元の絵から切り出した（体は手と貝の後ろを体の青で埋めてある）。

   ・その日はじめてポータルを開いたときは、画面の左から走ってきて座る
   ・ふだんはあいさつの横で、まばたきしたり、しっぽを振ったり、貝をなでたりしている
   ・タップするとジャンプして、ひとこと話す
   ・スマホで「動きを減らす」にしている人には、止まった絵だけを出す
   ・ボタンやお知らせの操作は邪魔しない（キャラ自身だけがタップに反応する）

   部品の画像は Service Worker で端末に保存するので、圏外でも出る。
   ひとことを変えたいときは LINES を書き換える。
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var DAY_KEY = 'siegBuddyDay';   // その日もう走ってきたか

  // タップしたときのひとこと（時間帯ごと）。{name} は選んでいる名前に置き換わる
  var LINES = {
    morning: ['おはよ〜！', 'きょうもいっしょにがんばろ', 'あさごはん たべた？', '{name}さん、おはよ！'],
    day:     ['おつかれさま〜', 'ちょっと ひとやすみしよ', 'すいぶん とってね', '{name}さん、ファイト！'],
    night:   ['きょうもおつかれさま！', 'ゆっくり やすんでね', 'あしたも いい日になるよ', '{name}さん、おつかれ！']
  };

  var head = document.querySelector('#v-home .head');
  if (!head) return;

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function lsGet(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  /* 部品ごとの動き。回転の中心は絵の中の位置（％）で指定する */
  var CSS =
    '#v-home .head{position:relative;padding-right:74px}' +
    '.sb{position:absolute;right:10px;bottom:-6px;width:50px;height:86px;cursor:pointer;' +
      '-webkit-tap-highlight-color:transparent;touch-action:manipulation;z-index:2}' +
    '.sb .me,.sb .ly,.sb svg{position:absolute;left:0;top:0;width:100%;height:100%;display:block}' +
    '.sb .ly{pointer-events:none;-webkit-user-drag:none;user-select:none}' +
    '.sb .shadow{position:absolute;left:4px;right:4px;bottom:-1px;height:6px;border-radius:50%;background:rgba(0,0,0,.12)}' +
    '.sb .me{transform-origin:50% 97%}' +
    '.sb .tail{transform-origin:19% 81%;animation:sb-tail 2.8s ease-in-out infinite}' +
    '.sb .leg-l{transform-origin:31% 87%}.sb .leg-r{transform-origin:69% 87%}' +
    '.sb .hold{transform-origin:47% 60%;animation:sb-pat 6s ease-in-out infinite}' +
    '.sb .lid{opacity:0;animation:sb-blink 4.6s infinite}' +
    '.sb.idle .me{animation:sb-breathe 3.4s ease-in-out infinite}' +
    '.sb.run{transition:transform 1.9s cubic-bezier(.3,.1,.3,1)}' +
    '.sb.run .me{animation:sb-waddle .3s ease-in-out infinite alternate}' +
    '.sb.run .leg-l{animation:sb-step-l .3s ease-in-out infinite alternate}' +
    '.sb.run .leg-r{animation:sb-step-r .3s ease-in-out infinite alternate-reverse}' +
    '.sb.run .tail{animation:sb-tail .3s ease-in-out infinite alternate}' +
    '.sb.jump .me{animation:sb-jump .6s cubic-bezier(.3,.6,.4,1)}' +
    '.sb.jump .hold{animation:sb-raise .6s ease-out}' +
    '.sb-say{position:absolute;right:62px;bottom:26px;max-width:170px;padding:7px 11px;border-radius:14px 14px 4px 14px;' +
      'background:var(--surface,#fff);color:var(--ink,#0E1A2C);box-shadow:0 2px 10px rgba(14,26,44,.12);' +
      'border:1px solid var(--hair,#E3E6EA);font-weight:700;font-size:12.5px;line-height:1.45;white-space:nowrap;' +
      'opacity:0;transform:translateY(4px) scale(.96);transform-origin:100% 100%;transition:opacity .2s,transform .2s;pointer-events:none;z-index:3}' +
    '.sb-say.show{opacity:1;transform:none}' +
    '@keyframes sb-blink{0%,93%,100%{opacity:0}94%,97%{opacity:1}}' +
    '@keyframes sb-tail{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(9deg)}}' +
    '@keyframes sb-pat{0%,82%,100%{transform:none}86%,94%{transform:translateY(-1.5px) rotate(-3deg)}90%{transform:translateY(0) rotate(1deg)}}' +
    '@keyframes sb-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.015,.985)}}' +
    '@keyframes sb-waddle{from{transform:translateY(0) rotate(-6deg)}to{transform:translateY(-5px) rotate(6deg)}}' +
    '@keyframes sb-step-l{from{transform:rotate(0)}to{transform:rotate(9deg) translateY(-2px)}}' +
    '@keyframes sb-step-r{from{transform:rotate(0)}to{transform:rotate(-9deg) translateY(-2px)}}' +
    '@keyframes sb-jump{0%{transform:translateY(0) scale(1.08,.9)}35%{transform:translateY(-20px) scale(.96,1.05)}70%{transform:translateY(0) scale(1.05,.94)}100%{transform:none}}' +
    '@keyframes sb-raise{0%,100%{transform:none}35%{transform:translateY(-5px) rotate(-5deg)}}' +
    '@media (prefers-reduced-motion:reduce){.sb *,.sb{animation:none!important;transition:none!important}}';

  function layer(name) { return '<img class="ly ' + name + '" src="buddy/' + name + '.png" alt="" decoding="async">'; }
  // まばたき：目の上を体の青でふさぎ、閉じた目の線を描く（座標は元の絵のピクセル）
  var LID =
    '<svg class="lid" viewBox="0 0 1060 1831" aria-hidden="true">' +
      '<ellipse cx="218" cy="313" rx="40" ry="42" fill="#55B8FB"/>' +
      '<ellipse cx="771" cy="287" rx="41" ry="42" fill="#55B8FB"/>' +
      '<path d="M183 318 Q218 334 253 318 M736 292 Q771 308 806 292" fill="none" stroke="#303030" stroke-width="10" stroke-linecap="round"/>' +
    '</svg>';
  var HTML = '<span class="shadow"></span><span class="me">' +
    layer('tail') + layer('leg-l') + layer('leg-r') + layer('body') + layer('hold') + LID + '</span>';

  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  var el = document.createElement('div');
  el.className = 'sb idle';
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', 'ぼのぼの（タップするとひとこと話します）');
  el.title = 'ぼのぼの © いがらしみきお';
  el.tabIndex = 0;
  el.innerHTML = HTML;
  head.appendChild(el);

  var say = document.createElement('div');
  say.className = 'sb-say';
  say.setAttribute('aria-live', 'polite');
  head.appendChild(say);

  function line() {
    var h = new Date().getHours();
    var list = LINES[h < 10 ? 'morning' : h < 18 ? 'day' : 'night'];
    var name = lsGet('siegStaff');
    var pool = name ? list : list.filter(function (s) { return s.indexOf('{name}') < 0; });
    return pool[Math.floor(Math.random() * pool.length)].replace('{name}', name);
  }

  var sayTimer = 0;
  function speak(text) {
    say.textContent = text;
    say.classList.add('show');
    clearTimeout(sayTimer);
    sayTimer = setTimeout(function () { say.classList.remove('show'); }, 2400);
  }

  function jump() {
    el.classList.remove('jump');
    void el.offsetWidth;          // 続けて押してももう一度跳ぶ
    el.classList.add('jump');
  }

  function poke() {
    if (el.classList.contains('run')) return;
    if (!reduce) jump();
    speak(line());
    if (navigator.vibrate) navigator.vibrate(8);
  }
  el.addEventListener('click', poke);
  el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); poke(); } });
  el.addEventListener('animationend', function (e) { if (e.animationName === 'sb-jump') el.classList.remove('jump'); });

  // その日はじめて開いたときは、画面の左はしから走ってくる
  if (!reduce && lsGet(DAY_KEY) !== today()) {
    lsSet(DAY_KEY, today());
    var from = -(el.getBoundingClientRect().right + 12);
    el.classList.remove('idle');
    el.style.transform = 'translateX(' + from + 'px)';
    void el.offsetWidth;
    el.classList.add('run');
    requestAnimationFrame(function () {
      el.style.transform = 'translateX(0)';
    });
    el.addEventListener('transitionend', function done(e) {
      if (e.propertyName !== 'transform') return;
      el.removeEventListener('transitionend', done);
      el.classList.remove('run');
      el.style.transform = '';
      el.classList.add('idle');
      jump();
      speak(line());
    });
  }
})();
