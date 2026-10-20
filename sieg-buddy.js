/* ═══════════════════════════════════════════════════════════════
   sieg-buddy.js — ホームのあいさつの横にいる小さなキャラ（ぼのぼの）

   ※ キャラは ぼのぼの（© いがらしみきお）。そのまま描いて使う許可を得て、
     SVG で描き起こしている。体の部分ごとに動く（まばたき・ひげ・しっぽ・足・貝）。

   ・その日はじめてポータルを開いたときは、画面の左から走ってきて座る
   ・ふだんはあいさつの横で、まばたきしたり、ひげやしっぽを動かしたりしている
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

  /* 部分ごとの動き。回転の中心は SVG の座標（viewBox 0 0 120 192）で指定する */
  var CSS =
    '#v-home .head{position:relative;padding-right:62px}' +
    '.sb{position:absolute;right:6px;bottom:-4px;width:52px;height:84px;cursor:pointer;' +
      '-webkit-tap-highlight-color:transparent;touch-action:manipulation;z-index:2}' +
    '.sb svg{width:100%;height:100%;overflow:visible;display:block}' +
    '.sb .shadow{position:absolute;left:6px;right:6px;bottom:0;height:6px;border-radius:50%;background:rgba(0,0,0,.12)}' +
    '.sb .me,.sb .tail,.sb .leg,.sb .hd,.sb .hold,.sb .whisk{transform-box:view-box}' +
    '.sb .me{transform-origin:60px 186px}' +
    '.sb .tail{transform-origin:31px 155px;animation:sb-tail 2.8s ease-in-out infinite}' +
    '.sb .leg-l{transform-origin:38px 166px}.sb .leg-r{transform-origin:82px 166px}' +
    '.sb .hd{transform-origin:58px 86px}' +
    '.sb .hold{transform-origin:60px 112px}' +
    '.sb .whisk-l{transform-origin:47px 64px;animation:sb-whisk-l 5.2s ease-in-out infinite}' +
    '.sb .whisk-r{transform-origin:70px 64px;animation:sb-whisk-r 5.2s ease-in-out infinite}' +
    '.sb .eye{transform-box:fill-box;transform-origin:50% 50%;animation:sb-blink 4.6s infinite}' +
    '.sb.idle .me{animation:sb-breathe 3.4s ease-in-out infinite}' +
    '.sb.idle .hd{animation:sb-tilt 7s ease-in-out infinite}' +
    '.sb.run{transition:transform 1.9s cubic-bezier(.3,.1,.3,1)}' +
    '.sb.run .me{animation:sb-waddle .3s ease-in-out infinite alternate}' +
    '.sb.run .leg-l{animation:sb-step .3s ease-in-out infinite alternate}' +
    '.sb.run .leg-r{animation:sb-step .3s ease-in-out infinite alternate-reverse}' +
    '.sb.run .tail{animation:sb-tail .3s ease-in-out infinite alternate}' +
    '.sb.jump .me{animation:sb-jump .6s cubic-bezier(.3,.6,.4,1)}' +
    '.sb.jump .hold{animation:sb-raise .6s ease-out}' +
    '.sb-say{position:absolute;right:58px;bottom:26px;max-width:170px;padding:7px 11px;border-radius:14px 14px 4px 14px;' +
      'background:var(--surface,#fff);color:var(--ink,#0E1A2C);box-shadow:0 2px 10px rgba(14,26,44,.12);' +
      'border:1px solid var(--hair,#E3E6EA);font-weight:700;font-size:12.5px;line-height:1.45;white-space:nowrap;' +
      'opacity:0;transform:translateY(4px) scale(.96);transform-origin:100% 100%;transition:opacity .2s,transform .2s;pointer-events:none;z-index:3}' +
    '.sb-say.show{opacity:1;transform:none}' +
    '@keyframes sb-blink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.12)}}' +
    '@keyframes sb-whisk-l{0%,80%,100%{transform:rotate(0)}85%{transform:rotate(-9deg)}90%{transform:rotate(4deg)}}' +
    '@keyframes sb-whisk-r{0%,80%,100%{transform:rotate(0)}85%{transform:rotate(9deg)}90%{transform:rotate(-4deg)}}' +
    '@keyframes sb-tail{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(10deg)}}' +
    '@keyframes sb-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.015,.985)}}' +
    '@keyframes sb-tilt{0%,70%,100%{transform:rotate(0)}78%,88%{transform:rotate(-6deg)}}' +
    '@keyframes sb-waddle{from{transform:translateY(0) rotate(-6deg)}to{transform:translateY(-6px) rotate(6deg)}}' +
    '@keyframes sb-step{from{transform:translateY(0)}to{transform:translateY(-9px) rotate(-8deg)}}' +
    '@keyframes sb-jump{0%{transform:translateY(0) scale(1.08,.9)}35%{transform:translateY(-22px) scale(.96,1.05)}70%{transform:translateY(0) scale(1.05,.94)}100%{transform:none}}' +
    '@keyframes sb-raise{0%,100%{transform:none}35%{transform:translateY(-10px) rotate(-6deg)}}' +
    '@media (prefers-reduced-motion:reduce){.sb *,.sb{animation:none!important;transition:none!important}}';

  var SVG =
    '<svg viewBox="0 0 120 192" aria-hidden="true">' +
    '<defs>' +
    '<style>' +
    '.ok{stroke:#262626;stroke-width:3.4;stroke-linejoin:round;stroke-linecap:round;fill:#262626}' +
    '.bl{fill:#55B5F7}' +
    '.ln{fill:none;stroke:#262626;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}' +
    '</style>' +
    '<filter id="glow" x="-5%" y="-5%" width="110%" height="110%">' +
    '<feMorphology in="SourceAlpha" operator="erode" radius="1.6" result="e"/>' +
    '<feGaussianBlur in="e" stdDeviation="2" result="b"/>' +
    '<feComposite in="SourceAlpha" in2="b" operator="out" result="ring"/>' +
    '<feFlood flood-color="#fff" flood-opacity=".85"/>' +
    '<feComposite in2="ring" operator="in" result="g"/>' +
    '<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="g"/></feMerge>' +
    '</filter>' +
    '<path id="tail" d="M29 145 C19 146 10 149 8 156 C7 162 13 164 22 161 C27 159 30 157 31 155 Z"/>' +
    '<path id="legL" d="M31 158 L31 175 C25 176 17 177 13 180 C10 183 12 186 19 186 L44 186 C46 181 46 173 46 165 Z"/>' +
    '<path id="legR" d="M74 165 C74 173 75 181 77 186 L103 186 C109 186 111 182 107 179 C102 176 95 176 89 175 L89 158 Z"/>' +
    '<path id="torso" d="M34 100 C29 122 29 146 31 167 L45 167 C48 161 72 161 75 167 L89 167 C91 146 92 122 86 98 C78 89 43 89 34 100 Z"/>' +
    '<circle id="shL" cx="38.5" cy="108" r="12.5"/>' +
    '<circle id="shR" cx="82" cy="105.5" r="11.5"/>' +
    '<path id="headShape" d="M58 3 C82 3 98.5 22 98.5 46 C98.5 71 81.5 87 58 87 C34.5 87 17.5 71 17.5 46 C17.5 22 34 3 58 3 Z"/>' +
    '</defs>' +
    '<g class="me"><g class="tail"><use href="#tail" class="ok"/><use href="#tail" class="bl" filter="url(#glow)"/></g>' +
    '<g class="leg leg-l"><use href="#legL" class="ok"/><use href="#legL" class="bl" filter="url(#glow)"/></g>' +
    '<g class="leg leg-r"><use href="#legR" class="ok"/><use href="#legR" class="bl" filter="url(#glow)"/></g>' +
    '<g class="body">' +
    '<use href="#torso" class="ok"/><use href="#shL" class="ok"/><use href="#shR" class="ok"/>' +
    '<g filter="url(#glow)"><use href="#torso" class="bl"/><use href="#shL" class="bl"/><use href="#shR" class="bl"/></g>' +
    '<path class="ln" d="M46 166 C49 161.5 71 161.5 74 166"/>' +
    '</g>' +
    '<g class="hold">' +
    '<path class="ln" d="M80 96 C82 104 81 111 77.5 117"/>' +
    '<g class="shell">' +
    '<path d="M57 117 C56 107 66 102 74 104 C78 112 78 126 74 135 C66 137 58 129 57 117 Z" fill="#F8AEDD" stroke="#262626" stroke-width="1.8" stroke-linejoin="round"/>' +
    '<path class="ln" d="M75.6 109 L72.6 109.4 M76.6 115 L73 115 M76.6 121 L73 121 M75.9 127 L72.6 127 M74.6 132 L71.6 131.5" style="stroke-width:1.4"/>' +
    '</g>' +
    '<g class="arm-l">' +
    '<path d="M43 97 C48 106 53 113 59 120" stroke="#262626" stroke-width="9" fill="none" stroke-linecap="round"/>' +
    '<path d="M43 97 C48 106 53 113 59 120" stroke="#55B5F7" stroke-width="5.6" fill="none" stroke-linecap="round"/>' +
    '<path class="ln" d="M58.5 116.5 C61.5 116.5 62.5 119 61.2 121.5" style="stroke-width:1.4"/>' +
    '</g>' +
    '</g>' +
    '<g class="hd">' +
    '<use href="#headShape" class="ok"/><use href="#headShape" class="bl" filter="url(#glow)"/>' +
    '<ellipse class="eye" cx="29" cy="33.5" rx="3.5" ry="3.7" fill="#262626"/>' +
    '<ellipse class="eye" cx="84.5" cy="30.5" rx="3.5" ry="3.7" fill="#262626"/>' +
    '<circle cx="50" cy="66.5" r="8.6" fill="#F6F6F6" stroke="#262626" stroke-width="1.8"/>' +
    '<circle cx="66.5" cy="66.5" r="8.6" fill="#F6F6F6" stroke="#262626" stroke-width="1.8"/>' +
    '<g class="whisk whisk-l"><path class="ln" d="M37.5 56 L47 61 M36 63.8 L46.5 63.8 M39.5 72.5 L47 68" style="stroke-width:1.3"/></g>' +
    '<g class="whisk whisk-r"><path class="ln" d="M79 55 L70 60.5 M81 63.8 L70.5 63.8 M78.5 72.5 L70.5 68" style="stroke-width:1.3"/></g>' +
    '<ellipse cx="58" cy="51.5" rx="7.8" ry="7.4" fill="#262626"/>' +
    '<path class="ln" d="M58.2 58.5 L58.2 63.5" style="stroke-width:1.4"/>' +
    '</g>' +
    '</g>' +
    '</svg>';

  var HTML = '<span class="shadow"></span>' + SVG;

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
