/** @format */

//
// 皮肤调试面板。按 Shift+D 唤出——常驻的加载器（layout/_partial/skin-devtool.ejs）
// 在首次按键时才注入本文件，所以访客不会为一个调试工具付下载成本。
//
// 面板的外壳 DOM 和样式都在这里用 JS 建，不依赖模板里的任何标记，这样任何页面
// 都能按需注入。
//
window.__sdtInit = function () {
(function () {
  var root = document.documentElement;
  var KEY = 'sdt.overrides.v1';

  // ── 外壳与样式都在这里建，本文件因此可以被任何页面按需注入 ──────────────
  var CSS = '/* 全部写死，不读 token —— 见顶部说明 */\n  #skin-devtool { position: fixed; right: 16px; bottom: 76px; z-index: 99999;\n    font: 13px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif; }\n  @media (min-width: 1022px) { #skin-devtool { bottom: 16px; } }\n\n  #skin-devtool.sdt-no-button #sdt-toggle { display: none; }\n  #sdt-toggle { width: 44px; height: 44px; border-radius: 50%; border: 1px solid rgba(0,0,0,.12);\n    background: #fff; box-shadow: 0 6px 20px rgba(0,0,0,.18); cursor: pointer; font-size: 20px;\n    line-height: 1; display: grid; place-items: center; padding: 0; }\n  #sdt-toggle:hover { transform: translateY(-1px); }\n\n  #sdt-panel { display: none; position: absolute; right: 0; bottom: 54px; width: 300px;\n    max-height: min(70vh, 620px); overflow: auto; overscroll-behavior: contain;\n    background: #fff; color: #1f2430; border: 1px solid rgba(0,0,0,.1); border-radius: 14px;\n    box-shadow: 0 20px 60px rgba(0,0,0,.28); }\n  #skin-devtool[data-open="true"] #sdt-panel { display: block; }\n\n  #sdt-panel header { position: sticky; top: 0; z-index: 1; display: flex; align-items: center;\n    justify-content: space-between; padding: 12px 14px; font-weight: 600;\n    background: #fff; border-bottom: 1px solid rgba(0,0,0,.08); }\n  #sdt-close { border: 0; background: none; font-size: 20px; line-height: 1; cursor: pointer;\n    color: #6b7280; padding: 0 2px; }\n\n  #sdt-body { padding: 4px 14px 12px; }\n  .sdt-group { margin-top: 14px; }\n  .sdt-group > b { display: block; font-size: 11px; letter-spacing: .08em; text-transform: uppercase;\n    color: #9096a2; margin-bottom: 6px; }\n  .sdt-row { display: grid; grid-template-columns: 76px 1fr 42px; align-items: center;\n    gap: 8px; margin: 5px 0; }\n  .sdt-row > label { color: #4b5563; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n  .sdt-row output { text-align: right; color: #6b7280; font-variant-numeric: tabular-nums; font-size: 12px; }\n  .sdt-row input[type="range"] { width: 100%; accent-color: #71afdd; }\n  .sdt-row input[type="color"] { width: 100%; height: 24px; padding: 0; border: 1px solid rgba(0,0,0,.15);\n    border-radius: 6px; background: none; cursor: pointer; }\n  .sdt-row select { width: 100%; padding: 3px 6px; border: 1px solid rgba(0,0,0,.15);\n    border-radius: 6px; background: #fff; color: inherit; font: inherit; }\n\n  .sdt-seg { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }\n  .sdt-seg button { padding: 7px 0; border: 1px solid rgba(0,0,0,.15); border-radius: 8px;\n    background: #fff; color: #4b5563; cursor: pointer; font: inherit; font-size: 12px; }\n  .sdt-seg button[aria-pressed="true"] { background: #71afdd; border-color: #71afdd; color: #fff; font-weight: 600; }\n\n  #sdt-panel footer { position: sticky; bottom: 0; display: grid; grid-template-columns: 1fr auto;\n    gap: 8px; padding: 10px 14px; background: #fff; border-top: 1px solid rgba(0,0,0,.08); }\n  #sdt-panel footer button { padding: 8px 12px; border-radius: 8px; border: 1px solid #71afdd;\n    background: #71afdd; color: #fff; font: inherit; font-weight: 600; cursor: pointer; }\n  #sdt-panel footer button.ghost { background: #fff; color: #6b7280; border-color: rgba(0,0,0,.15); font-weight: 400; }\n\n  @media (prefers-color-scheme: dark) {\n    #sdt-toggle, #sdt-panel, #sdt-panel header, #sdt-panel footer { background: #24262b; }\n    #sdt-toggle { border-color: rgba(255,255,255,.14); }\n    #sdt-panel { color: #e7eaf0; border-color: rgba(255,255,255,.12); }\n    #sdt-panel header { border-bottom-color: rgba(255,255,255,.1); }\n    #sdt-panel footer { border-top-color: rgba(255,255,255,.1); }\n    .sdt-row > label { color: #b9bec9; }\n    .sdt-seg button, .sdt-row select { background: #2d3036; color: #b9bec9; border-color: rgba(255,255,255,.14); }\n    .sdt-seg button[aria-pressed="true"] { background: #71afdd; color: #14161a; }\n    #sdt-panel footer button.ghost { background: #2d3036; color: #b9bec9; border-color: rgba(255,255,255,.14); }\n  }';

  function mount() {
    var style = document.createElement('style');
    style.id = 'sdt-style';
    style.textContent = CSS;
    document.head.appendChild(style);

    var box = document.createElement('div');
    box.id = 'skin-devtool';
    box.dataset.open = 'false';
    box.innerHTML =
      '<button id="sdt-toggle" type="button" title="皮肤调试面板（Shift+D）">🎨</button>' +
      '<div id="sdt-panel" role="dialog" aria-label="皮肤调试面板">' +
        '<header><span>皮肤调试</span>' +
        '<button id="sdt-close" type="button" aria-label="关闭">×</button></header>' +
        '<div id="sdt-body"></div>' +
        '<footer>' +
          '<button id="sdt-export" type="button">复制为 tokens.scss</button>' +
          '<button id="sdt-reset" type="button" class="ghost">重置</button>' +
        '</footer>' +
      '</div>';
    document.body.appendChild(box);
    // 浮标按钮默认不显示：面板是靠 Shift+D 唤出的，没必要给访客留个图标。
    // 主题配置 skin_devtool: true 时，常驻加载器会加上这个 class 把它显出来。
    if (!window.__sdtShowButton) box.classList.add('sdt-no-button');
    return box;
  }

  var box = mount();

  var root = document.documentElement;
  var KEY = 'sdt.overrides.v1';
  // 配置里的皮肤由常驻加载器写在 window 上——这是个独立 JS 文件，没有 EJS 插值。
  var DEFAULT_SKIN = window.__sdtDefaultSkin || 'modern';

  // 阴影没法用滑块调（它是一串复合值），给几档预设换整组。
  var SHADOWS = {
    '（不改）': null,
    '无':   { '--shadow-1': 'none', '--shadow-2': 'none', '--shadow-3': 'none', '--shadow-hover': 'none' },
    '轻':   { '--shadow-1': '0 1px 2px rgba(15,23,42,.04)',
              '--shadow-2': '0 2px 6px rgba(15,23,42,.05)',
              '--shadow-3': '0 6px 16px rgba(15,23,42,.07)',
              '--shadow-hover': '0 10px 24px rgba(15,23,42,.09)' },
    '重':   { '--shadow-1': '0 2px 4px rgba(15,23,42,.08), 0 1px 3px rgba(15,23,42,.10)',
              '--shadow-2': '0 8px 20px rgba(15,23,42,.12), 0 3px 8px rgba(15,23,42,.08)',
              '--shadow-3': '0 20px 44px rgba(15,23,42,.18), 0 8px 18px rgba(15,23,42,.10)',
              '--shadow-hover': '0 28px 60px rgba(15,23,42,.22), 0 10px 24px rgba(15,23,42,.12)' }
  };

  var GROUPS = [
    { name: '品牌色', rows: [
      { v: '--main-color', label: '主色',  type: 'color' },
      { v: '--sub-color',  label: '辅色',  type: 'color' }
    ]},
    { name: '表面', rows: [
      { v: '--surface-1',  label: '卡片',     type: 'color' },
      { v: '--surface-2',  label: '页面底',   type: 'color' },
      { v: '--text-muted', label: '次要文字', type: 'color' }
    ]},
    { name: '圆角', rows: [
      { v: '--radius-sm', label: '小',   type: 'range', min: 0, max: 24, unit: 'px' },
      { v: '--radius-md', label: '中',   type: 'range', min: 0, max: 32, unit: 'px' },
      { v: '--radius-lg', label: '大',   type: 'range', min: 0, max: 40, unit: 'px' },
      { v: '--radius-xl', label: '特大', type: 'range', min: 0, max: 48, unit: 'px' }
    ]},
    { name: '动效', rows: [
      { v: '--duration-1', label: '快',   type: 'range', min: 0, max: 400, step: 10, unit: 'ms' },
      { v: '--duration-2', label: '中',   type: 'range', min: 0, max: 600, step: 10, unit: 'ms' },
      { v: '--duration-3', label: '慢',   type: 'range', min: 0, max: 900, step: 10, unit: 'ms' },
      { v: '--lift-hover', label: '悬停抬起', type: 'range', min: -14, max: 0, unit: 'px' }
    ]}
  ];

  var overrides = {};
  try { overrides = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { overrides = {}; }

  function currentSkin() { return root.dataset.skin || 'modern'; }

  // 读 token 当前值。已被覆盖的读覆盖值，否则读样式表算出来的值。
  function read(name) {
    if (overrides[name] != null) return overrides[name];
    return getComputedStyle(root).getPropertyValue(name).trim();
  }
  function num(name) { return parseFloat(read(name)) || 0; }

  // <input type="color"> 只吃 #rrggbb。表面色里可能有 rgba()/带 alpha 的十六进制，
  // 用画布把任意颜色规范化成 6 位十六进制。
  var probe = document.createElement('canvas').getContext('2d');
  function toHex(css) {
    if (/^#[0-9a-f]{6}$/i.test(css)) return css.toLowerCase();
    try {
      probe.fillStyle = '#000';
      probe.fillStyle = css;
      var out = probe.fillStyle;
      if (/^#[0-9a-f]{6}$/i.test(out)) return out.toLowerCase();
      var m = out.match(/rgba?\(([^)]+)\)/);
      if (!m) return '#000000';
      var p = m[1].split(',').map(parseFloat);
      return '#' + p.slice(0, 3).map(function (c) {
        return ('0' + Math.round(c).toString(16)).slice(-2);
      }).join('');
    } catch (e) { return '#000000'; }
  }

  function apply(name, value) {
    overrides[name] = value;
    root.style.setProperty(name, value);
    save();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(overrides)); } catch (e) {}
  }

  // 覆盖值的重放交给常驻加载器（skin-devtool.ejs）——它在每个页面都跑，
  // 所以翻页后皮肤不会丢；本文件只在按下 Shift+D 后才加载，不能承担这个职责。

  var body = document.getElementById('sdt-body');

  function group(name) {
    var g = document.createElement('div');
    g.className = 'sdt-group';
    var b = document.createElement('b'); b.textContent = name; g.appendChild(b);
    body.appendChild(g);
    return g;
  }

  // —— 皮肤切换 ——
  var gSkin = group('皮肤');
  var seg = document.createElement('div'); seg.className = 'sdt-seg';
  ['modern', 'classic', 'darkroom', 'gallery', 'editorial'].forEach(function (s) {
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = s;
    b.setAttribute('aria-pressed', String(currentSkin() === s));
    b.addEventListener('click', function () {
      root.dataset.skin = s;
      overrides['data-skin'] = s; save();
      seg.querySelectorAll('button').forEach(function (x) {
        x.setAttribute('aria-pressed', String(x.textContent === s));
      });
      refresh(); // 换皮肤后各 token 的基准值变了，控件要跟着走
    });
    seg.appendChild(b);
  });
  gSkin.appendChild(seg);

  // —— 各组控件 ——
  var inputs = [];
  GROUPS.forEach(function (grp) {
    var g = group(grp.name);
    grp.rows.forEach(function (row) {
      var wrap = document.createElement('div'); wrap.className = 'sdt-row';
      var lab = document.createElement('label'); lab.textContent = row.label;
      var input = document.createElement('input');
      var out = document.createElement('output');

      if (row.type === 'color') {
        input.type = 'color';
        input.value = toHex(read(row.v));
        out.textContent = '';
        input.addEventListener('input', function () { apply(row.v, input.value); });
      } else {
        input.type = 'range';
        input.min = row.min; input.max = row.max; input.step = row.step || 1;
        input.value = num(row.v);
        out.textContent = input.value + row.unit;
        input.addEventListener('input', function () {
          out.textContent = input.value + row.unit;
          apply(row.v, input.value + row.unit);
        });
      }

      lab.htmlFor = input.id = 'sdt-' + row.v.replace(/^--/, '');
      wrap.appendChild(lab); wrap.appendChild(input); wrap.appendChild(out);
      g.appendChild(wrap);
      inputs.push({ row: row, input: input, out: out });
    });
  });

  // —— 阴影预设 ——
  var gSh = group('阴影');
  var shRow = document.createElement('div'); shRow.className = 'sdt-row';
  var shLab = document.createElement('label'); shLab.textContent = '强度';
  var shadowSelect = document.createElement('select');
  Object.keys(SHADOWS).forEach(function (k) {
    var o = document.createElement('option'); o.value = k; o.textContent = k; shadowSelect.appendChild(o);
  });
  shadowSelect.addEventListener('change', function () {
    var preset = SHADOWS[shadowSelect.value];
    if (!preset) return;
    Object.keys(preset).forEach(function (k) { apply(k, preset[k]); });
  });
  shRow.appendChild(shLab); shRow.appendChild(shadowSelect); shRow.appendChild(document.createElement('output'));
  gSh.appendChild(shRow);

  // 切皮肤 / 重置后，把控件拉回当前真实值
  function refresh() {
    inputs.forEach(function (it) {
      if (it.row.type === 'color') {
        it.input.value = toHex(read(it.row.v));
      } else {
        it.input.value = num(it.row.v);
        it.out.textContent = it.input.value + it.row.unit;
      }
    });
  }

  // —— 导出 ——
  document.getElementById('sdt-export').addEventListener('click', function (e) {
    var keys = Object.keys(overrides).filter(function (k) { return k !== 'data-skin'; });
    var btn = e.currentTarget;
    if (!keys.length) { btn.textContent = '没有改动'; setTimeout(function(){ btn.textContent = '复制为 tokens.scss'; }, 1400); return; }
    var sel = currentSkin();
    var head = sel === 'modern' ? ':root {' : "[data-skin='" + sel + "'] {";
    var css = head + '\n' + keys.sort().map(function (k) {
      return '  ' + k + ': ' + overrides[k] + ';';
    }).join('\n') + '\n}';
    var done = function (ok) {
      btn.textContent = ok ? '已复制 ✓' : '复制失败，见控制台';
      if (!ok) console.log(css);
      setTimeout(function () { btn.textContent = '复制为 tokens.scss'; }, 1600);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(css).then(function () { done(true); }, function () { done(false); });
    } else { done(false); }
  });

  // —— 重置 ——
  // 皮肤一起回到配置值。否则 localStorage 被清了、DOM 却还停在手动切过的皮肤上，
  // 当前页和下次加载会显示成两个样子。
  document.getElementById('sdt-reset').addEventListener('click', function () {
    Object.keys(overrides).forEach(function (k) {
      if (k !== 'data-skin') root.style.removeProperty(k);
    });
    overrides = {};
    try { localStorage.removeItem(KEY); } catch (e) {}
    root.dataset.skin = DEFAULT_SKIN;
    seg.querySelectorAll('button').forEach(function (x) {
      x.setAttribute('aria-pressed', String(x.textContent === DEFAULT_SKIN));
    });
    refresh();
    shadowSelect.value = '（不改）';
  });

  // —— 开关 ——
  // 每次打开都重读一遍当前值。必须是打开时读、不能是构造时读：--main-color 由
  // _partial/customize.ejs 定义，而它在 layout.ejs 里排在 after-footer 之后，
  // 本脚本执行时那段 <style> 还没解析。顺带也能跟上暗色模式的切换。
  function setOpen(v) { box.dataset.open = String(v); if (v) refresh(); }
  document.getElementById('sdt-toggle').addEventListener('click', function () {
    setOpen(box.dataset.open !== 'true');
  });
  document.getElementById('sdt-close').addEventListener('click', function () { setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });

  // 交给常驻加载器：Shift+D 复用同一套开关逻辑，不另写一份
  window.__sdtToggle = function () { setOpen(box.dataset.open !== 'true'); };

})();
};
