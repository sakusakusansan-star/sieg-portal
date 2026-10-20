/* ═══════════════════════════════════════════════════════════════
   sieg-buddy.js — ホームのあいさつの横にいる小さなキャラ（ぼのぼの）

   ※ 絵は ぼのぼの（© いがらしみきお）。使用の許可を得て、bonobono.png を
     そのまま動かしている（絵そのものは描き変えない）。

   ・その日はじめてポータルを開いたときは、画面の左から走ってきて座る
   ・ふだんはあいさつの横で、ゆっくり体をゆらしている
   ・タップするとジャンプして、ひとこと話す
   ・スマホで「動きを減らす」にしている人には、止まった絵だけを出す
   ・ボタンやお知らせの操作は邪魔しない（キャラ自身だけがタップに反応する）

   画像は bonobono.png（Service Worker で端末に保存するので圏外でも出る）。
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

  /* 画像をそのまま動かす：走るときは左右によちよち揺れながら跳ねる */
  var CSS =
    '#v-home .head{position:relative;padding-right:60px}' +
    '.sb{position:absolute;right:8px;bottom:-4px;width:46px;height:80px;cursor:pointer;' +
      '-webkit-tap-highlight-color:transparent;touch-action:manipulation;z-index:2}' +
    '.sb .me{position:absolute;left:0;right:0;bottom:4px;transform-origin:50% 100%}' +
    '.sb img{display:block;width:100%;height:auto;pointer-events:none;-webkit-user-drag:none;user-select:none}' +
    '.sb .shadow{position:absolute;left:8px;right:8px;bottom:0;height:6px;border-radius:50%;background:rgba(0,0,0,.12)}' +
    '.sb.idle .me{animation:sb-breathe 3.4s ease-in-out infinite}' +
    '.sb.run{transition:transform 1.8s cubic-bezier(.3,.1,.3,1)}' +
    '.sb.run .me{animation:sb-waddle .32s ease-in-out infinite alternate}' +
    '.sb.jump .me{animation:sb-jump .55s cubic-bezier(.3,.6,.4,1)}' +
    '.sb-say{position:absolute;right:58px;bottom:26px;max-width:170px;padding:7px 11px;border-radius:14px 14px 4px 14px;' +
      'background:var(--surface,#fff);color:var(--ink,#0E1A2C);box-shadow:0 2px 10px rgba(14,26,44,.12);' +
      'border:1px solid var(--hair,#E3E6EA);font-weight:700;font-size:12.5px;line-height:1.45;white-space:nowrap;' +
      'opacity:0;transform:translateY(4px) scale(.96);transform-origin:100% 100%;transition:opacity .2s,transform .2s;pointer-events:none;z-index:3}' +
    '.sb-say.show{opacity:1;transform:none}' +
    '@keyframes sb-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.02,.98)}}' +
    '@keyframes sb-waddle{from{transform:translateY(0) rotate(-8deg)}to{transform:translateY(-5px) rotate(8deg)}}' +
    '@keyframes sb-jump{0%{transform:translateY(0) scale(1.08,.9)}35%{transform:translateY(-18px) scale(.95,1.06) rotate(-4deg)}70%{transform:translateY(0) scale(1.06,.93)}100%{transform:none}}' +
    '@media (prefers-reduced-motion:reduce){.sb *,.sb{animation:none!important;transition:none!important}}';

  var HTML = '<span class="shadow"></span><span class="me"><img src="bonobono.png" alt="" width="46" height="80" decoding="async"></span>';

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
