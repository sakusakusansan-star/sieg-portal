/* ═══════════════════════════════════════════════════════════════
   sieg-buddy.js — ホームのあいさつの横にいる小さなキャラ（オリジナル）

   ・その日はじめてポータルを開いたときは、画面の左から走ってきて座る
   ・ふだんはあいさつの横で、まばたきしたり、ときどき体をゆらしたりしている
   ・タップするとジャンプして、ひとこと話す
   ・スマホで「動きを減らす」にしている人には、止まった絵だけを出す
   ・ボタンやお知らせの操作は邪魔しない（キャラ自身だけがタップに反応する）

   絵は SVG で描いているので、画像ファイルは要らない（圏外でも出る）。
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

  /* 見た目：細い手描き風の線、ベタ塗り、点の目。頭のてっぺんに Sieg の百合の芽 */
  var CSS =
    '#v-home .head{position:relative;padding-right:74px}' +
    '.sb{position:absolute;right:4px;bottom:6px;width:62px;height:74px;cursor:pointer;' +
      '-webkit-tap-highlight-color:transparent;touch-action:manipulation;z-index:2;' +
      '--sb-line:#3A3330;--sb-skin:#FFF1E2;--sb-hair:#4A3426;--sb-coat:#2F4A7A;--sb-lily:#E2A43B;--sb-cheek:#F4A1A1}' +
    '@media (prefers-color-scheme:dark){.sb{--sb-line:#E9E2DA;--sb-hair:#6B4C36;--sb-coat:#4E6FA8}}' +
    '.sb svg{width:100%;height:100%;overflow:visible;display:block}' +
    '.sb .ln{fill:none;stroke:var(--sb-line);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}' +
    '.sb .ol{stroke:var(--sb-line);stroke-width:2.2;stroke-linejoin:round}' +
    '.sb .me{transform-box:fill-box;transform-origin:50% 100%}' +
    '.sb .eye{transform-box:fill-box;transform-origin:50% 50%;animation:sb-blink 4.2s infinite}' +
    '.sb .leg,.sb .arm{transform-box:view-box}' +
    '.sb .leg-l{transform-origin:26px 55px}.sb .leg-r{transform-origin:34px 55px}' +
    '.sb .arm-l{transform-origin:21px 44px}.sb .arm-r{transform-origin:39px 44px}' +
    '.sb .sprout{transform-box:fill-box;transform-origin:50% 100%;animation:sb-sway 3.6s ease-in-out infinite}' +
    '.sb.idle .me{animation:sb-breathe 3.2s ease-in-out infinite}' +
    '.sb.run{transition:transform 1.7s cubic-bezier(.3,.1,.3,1)}' +
    '.sb.run .me{animation:sb-bob .26s ease-in-out infinite alternate}' +
    '.sb.run .leg-l,.sb.run .arm-r{animation:sb-swing .26s ease-in-out infinite alternate}' +
    '.sb.run .leg-r,.sb.run .arm-l{animation:sb-swing .26s ease-in-out infinite alternate-reverse}' +
    '.sb.jump .me{animation:sb-jump .5s cubic-bezier(.3,.6,.4,1)}' +
    '.sb.jump .arm-l{animation:sb-wave-l .5s ease-out}.sb.jump .arm-r{animation:sb-wave-r .5s ease-out}' +
    '.sb-say{position:absolute;right:62px;bottom:30px;max-width:170px;padding:7px 11px;border-radius:14px 14px 4px 14px;' +
      'background:var(--surface,#fff);color:var(--ink,#0E1A2C);box-shadow:0 2px 10px rgba(14,26,44,.12);' +
      'border:1px solid var(--hair,#E3E6EA);font-weight:700;font-size:12.5px;line-height:1.45;white-space:nowrap;' +
      'opacity:0;transform:translateY(4px) scale(.96);transform-origin:100% 100%;transition:opacity .2s,transform .2s;pointer-events:none;z-index:3}' +
    '.sb-say.show{opacity:1;transform:none}' +
    '@keyframes sb-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}' +
    '@keyframes sb-sway{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}' +
    '@keyframes sb-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.015,.985)}}' +
    '@keyframes sb-bob{from{transform:translateY(0)}to{transform:translateY(-3px)}}' +
    '@keyframes sb-swing{from{transform:rotate(-28deg)}to{transform:rotate(28deg)}}' +
    '@keyframes sb-jump{0%{transform:translateY(0) scale(1.06,.92)}35%{transform:translateY(-16px) scale(.96,1.05)}70%{transform:translateY(0) scale(1.05,.94)}100%{transform:none}}' +
    '@keyframes sb-wave-l{0%,100%{transform:rotate(0)}40%{transform:rotate(55deg)}}' +
    '@keyframes sb-wave-r{0%,100%{transform:rotate(0)}40%{transform:rotate(-55deg)}}' +
    '@media (prefers-reduced-motion:reduce){.sb *,.sb{animation:none!important;transition:none!important}}';

  var SVG =
    '<svg viewBox="0 0 60 72" aria-hidden="true">' +
      '<ellipse cx="30" cy="69.5" rx="13" ry="2.2" fill="rgba(0,0,0,.10)"/>' +
      '<g class="me">' +
        // 足
        '<g class="leg leg-l"><path class="ln" d="M26 55 L25 65"/><path class="ln" d="M25 65 L21.5 65.5"/></g>' +
        '<g class="leg leg-r"><path class="ln" d="M34 55 L35 65"/><path class="ln" d="M35 65 L38.5 65.5"/></g>' +
        // 腕
        '<g class="arm arm-l"><path class="ln" d="M21 44 Q16 49 15.5 53"/></g>' +
        '<g class="arm arm-r"><path class="ln" d="M39 44 Q44 49 44.5 53"/></g>' +
        // 服（すそが広がった上着）
        '<path class="ol" fill="var(--sb-coat)" d="M22 41 Q30 38.5 38 41 L41.5 56 Q30 58.5 18.5 56 Z"/>' +
        '<path class="ln" d="M30 42 L30 47" style="stroke-width:1.6;opacity:.55"/>' +
        // 頭
        '<ellipse class="ol" fill="var(--sb-skin)" cx="30" cy="25" rx="16.5" ry="15"/>' +
        // 髪（丸いぼうし型、横は短く）
        '<path class="ol" fill="var(--sb-hair)" d="M13.6 25.5 Q12.5 9.5 30 9.6 Q47.5 9.5 46.4 25.5 Q44 19.5 38 18.4 Q36.5 21.5 33 21 Q31 17.8 27 18.6 Q24.5 21.8 20.5 20.5 Q16 21.5 13.6 25.5 Z"/>' +
        // 百合の芽
        '<g class="sprout">' +
          '<path class="ln" d="M30 10 Q30 6.5 30.6 4.2" style="stroke-width:1.8"/>' +
          '<path class="ol" fill="var(--sb-lily)" style="stroke-width:1.6" d="M30.6 4.4 Q28.4 1.6 30.6 -1.6 Q32.8 1.6 30.6 4.4 Z"/>' +
          '<path class="ol" fill="var(--sb-lily)" style="stroke-width:1.6" d="M30.4 4.6 Q26.4 4.8 25.6 1.6 Q28.8 1.2 30.4 4.6 Z"/>' +
          '<path class="ol" fill="var(--sb-lily)" style="stroke-width:1.6" d="M30.8 4.6 Q34.8 4.8 35.6 1.6 Q32.4 1.2 30.8 4.6 Z"/>' +
        '</g>' +
        // 顔
        '<ellipse class="eye" cx="24.2" cy="27.6" rx="1.6" ry="2.1" fill="var(--sb-line)"/>' +
        '<ellipse class="eye" cx="35.8" cy="27.6" rx="1.6" ry="2.1" fill="var(--sb-line)"/>' +
        '<ellipse cx="20.6" cy="32.2" rx="2.6" ry="1.5" fill="var(--sb-cheek)" opacity=".75"/>' +
        '<ellipse cx="39.4" cy="32.2" rx="2.6" ry="1.5" fill="var(--sb-cheek)" opacity=".75"/>' +
        '<path class="ln" d="M28.2 32.4 Q30 34.2 31.8 32.4" style="stroke-width:1.7"/>' +
      '</g>' +
    '</svg>';

  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  var el = document.createElement('div');
  el.className = 'sb idle';
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', 'キャラクター（タップするとひとこと話します）');
  el.tabIndex = 0;
  el.innerHTML = SVG;
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
