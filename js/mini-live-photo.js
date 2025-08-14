/*
 * mini-live-photo.js — 极小原生 Live Photo 播放器（vanilla JS）
 * 支持：
 *  - 触发角（corner hotspot）或整图触发（full）
 *  - 写在 <img data-livephoto> 上（自动包裹）或容器上
 *  - 悬停/按住/自动触发：data-trigger="hover|hold|auto"（默认 auto：桌面=hover，移动=hold）
 *  - 角标文案 data-label（默认 LIVE），位置 data-corner="tl|tr|br|bl"
 *  - 懒加载（进入视口）/ eager、出视口与切走标签页自动暂停
 *  - 有 video 播放，无 video 退化为纯图
 */
(function (global) {
  'use strict';

  const hasIO = 'IntersectionObserver' in global;

  function create(tag, cls){ const el = document.createElement(tag); if(cls) el.className = cls; return el; }
  function once(target, type){ return new Promise(res => target.addEventListener(type, res, { once:true })); }

  // 注入基础样式（包含 iOS 风格 LIVE 胶囊角标 + 放大命中区域）
  const BASE_CSS = `

  .mlp-wrap{position:relative;width:100%;height:100%;overflow:hidden;border-radius:inherit}
  .mlp-video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;transition:opacity .25s ease,transform .25s ease;pointer-events:none}
  .mlp-wrap.is-ready .mlp-video{opacity:1}
  .mlp-wrap.is-zoom  .mlp-video{transform:scale(1.06)}

  /* iOS 风格角标 */
  .mlp-badge{position:absolute;display:inline-flex;align-items:center;gap:.4em;padding:.35em .6em;border-radius:999px;background:rgba(255,255,255,.78);color:#111;font:600 12px/1.1 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;letter-spacing:.06em;user-select:none;cursor:pointer;border:1px solid rgba(255,255,255,.35);backdrop-filter:saturate(150%) blur(6px);-webkit-backdrop-filter:saturate(150%) blur(6px);z-index:5}
  .mlp-badge .txt{text-transform:uppercase;opacity:.95}
  .mlp-badge .icon{display:inline-flex;width:1.05em;height:1.05em}
  .mlp-badge .icon svg{width:100%;height:100%;display:block}
  /* 扩大可点区域（约 44px 触控命中） */
  .mlp-badge::after{content:"";position:absolute;inset:-8px;border-radius:999px}

  /* 角落定位 */
  .mlp-corner-tl{left:1em;top:1em}
  .mlp-corner-tr{right:.5em;top:.5em}
  .mlp-corner-br{right:.5em;bottom:.5em}
  .mlp-corner-bl{left:.5em;bottom:.5em}

  @media (prefers-color-scheme: dark){
    .mlp-badge{background:rgba(0,0,0,.6);color:#eee;border-color:rgba(255,255,255,.18)}
  }
  `;
  (function injectOnce(){
    if (typeof document==='undefined') return;
    if (document.getElementById('mlp-base-style')) return;
    const s = document.createElement('style'); s.id='mlp-base-style'; s.textContent=BASE_CSS; document.head.appendChild(s);
  })();

  class MiniLivePhoto {
    constructor(el, opts={}){
      // 允许把 data-livephoto 写在 <img> 上；自动包裹
      if (el && el.tagName && el.tagName.toUpperCase() === 'IMG' && el.hasAttribute('data-livephoto')) {
        const hostImg = el;
        const wrap = create('div','mlp-wrap');
        const p = hostImg.parentNode; if (p) p.insertBefore(wrap, hostImg);
        wrap.appendChild(hostImg);
        wrap.setAttribute('data-livephoto','');
        const dsi = hostImg.dataset || {};
        for (const k of Object.keys(dsi)) if (!wrap.dataset[k]) wrap.dataset[k] = dsi[k];
        hostImg.removeAttribute('data-livephoto');
        el = wrap;
      }

      this.el = el;
      const ds = el.dataset || {};
      this.opts = Object.assign({
        img: ds.img,
        video: ds.video,
        autoload: ds.autoload || 'visible',   // visible | eager
        sound: ds.sound || 'off',             // off | on | hold
        trigger: ds.trigger || (ds.hover === 'true' ? 'hover' : 'auto'),
        hotspot: ds.hotspot || 'full',        // full | corner
        corner: ((ds.corner || 'tl') + '').toLowerCase().split('|')[0], // 容错：只取第一个有效值
        label: ds.label || 'LIVE',            // 角标文案（默认 LIVE）
        ratio: ds.ratio || null,
      }, opts);

      // DOM
      this.img = el.querySelector('.mlp-img') || el.querySelector('img') || create('img','mlp-img');
      this.video = el.querySelector('.mlp-video') || el.querySelector('video') || create('video','mlp-video');
      if (!this.img.parentNode) el.appendChild(this.img);
      if (!this.video.parentNode) el.appendChild(this.video);

      if (!this.opts.img && this.img && (this.img.currentSrc || this.img.src)) {
        this.opts.img = this.img.currentSrc || this.img.src;
      }

      // 角落触发：生成角标（支持 data-label）
      // if (this.opts.hotspot === 'corner') {
        this.badge = el.querySelector('.mlp-badge') || create('div','mlp-badge');
        if (!this.badge.parentNode) {
          this.badge.innerHTML = `
            <span class="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="12" r="6.4" stroke="currentColor" stroke-width="2" opacity=".85"/>
                <circle cx="12" cy="12" r="9.6" stroke="currentColor" stroke-width="2" opacity=".7"/>
              </svg>
            </span>
            <span class="txt"></span>`;
          el.appendChild(this.badge);
        }
        const txt = this.badge.querySelector('.txt') || create('span','txt');
        txt.textContent = this.opts.label || 'LIVE';
        if (!txt.parentNode) this.badge.appendChild(txt);
        this._applyCorner();
      //}

      // 媒体属性
      this.video.playsInline = true;
      this.video.preload = 'metadata';
      this.video.muted = this.opts.sound === 'off' || this.opts.sound === 'hold';
      if (this.opts.ratio && !el.style.aspectRatio) el.style.aspectRatio = this.opts.ratio;

      // 懒加载
      if (this.opts.autoload === 'eager' || !hasIO) {
        this._load();
      } else {
        this._io = new IntersectionObserver((entries)=>{
          for (const e of entries) if (e.isIntersecting) { this._load(); this._io.disconnect(); break; }
        }, { threshold:0.1 });
        this._io.observe(el);
      }

      // 可见性/视口暂停
      this._onVisibility = () => { if (document.hidden) this.pause(); };
      document.addEventListener('visibilitychange', this._onVisibility);
      if (hasIO) {
        this._ioPause = new IntersectionObserver((entries)=>{
          for (const e of entries) if (!e.isIntersecting) this.pause();
        }, { threshold:0 });
        this._ioPause.observe(el);
      }

      // 交互
      this._bindControls();
    }

    async _load(){
      if (this._loaded) return; this._loaded = true;
      const { img, video } = this.opts; const hasVideo = !!video;
      if (img && !this.img.src) this.img.src = img;
      if (hasVideo && !this.video.src) this.video.src = video;

      const waits = [];
      if (this.img.decode) waits.push(this.img.decode().catch(()=>{}));
      if (hasVideo && this.video.readyState < 2) waits.push(once(this.video,'canplay'));
      if (!hasVideo) this.el.classList.add('no-video');
      await Promise.all(waits);
      this.el.classList.add('is-ready');
    }

    _bindControls(){
      const isFine = typeof matchMedia === 'function' && matchMedia('(pointer:fine)').matches;
      const anyCoarse = typeof matchMedia === 'function' && matchMedia('(any-pointer:coarse)').matches;
      const wantsHover = (this.opts.trigger === 'hover') || (this.opts.trigger === 'auto' && isFine);
      const target = (this.opts.hotspot === 'corner' && this.badge) ? this.badge : this.el;

      const start = async (ev) => {
        ev.preventDefault();
        if (!this.opts.video) return;
        try {
          if (this.opts.sound === 'hold') this.video.muted = false;
          // if (this.video.readyState < 2) await once(this.video,'canplay');
          this.video.currentTime = 0;
          await this.video.play();
          this.el.classList.add('is-playing','is-zoom');
        } catch (e) {
          this._emitError(e);
        }
      };

      const stop = () => {
        if (this.opts.sound === 'hold') this.video.muted = true;
        this.el.classList.remove('is-zoom','is-playing');
        this.video.pause();
      };

      if (this._unbind) this._unbind();

      if (wantsHover) {
        target.addEventListener('pointerenter', start);
        if (anyCoarse) target.addEventListener('pointerdown', start); // 触屏无 hover 时降级
        target.addEventListener('pointerleave', stop);
        target.addEventListener('pointercancel', stop);
        target.addEventListener('pointerup', stop);
        this._unbind = () => {
          target.removeEventListener('pointerenter', start);
          if (anyCoarse) target.removeEventListener('pointerdown', start);
          target.removeEventListener('pointerleave', stop);
          target.removeEventListener('pointercancel', stop);
          target.removeEventListener('pointerup', stop);
        };
      } else { // hold：按住播放
        target.addEventListener('pointerdown', start);
        target.addEventListener('pointerup', stop);
        target.addEventListener('pointercancel', stop);
        target.addEventListener('pointerleave', stop);
        this._unbind = () => {
          target.removeEventListener('pointerdown', start);
          target.removeEventListener('pointerup', stop);
          target.removeEventListener('pointercancel', stop);
          target.removeEventListener('pointerleave', stop);
        };
      }

      this.video.addEventListener('ended', () => this.el.classList.remove('is-zoom','is-playing'));
    }

    _applyCorner(){
      const map = { tl:'mlp-corner-tl', tr:'mlp-corner-tr', br:'mlp-corner-br', bl:'mlp-corner-bl' };
      let c = (this.opts.corner || 'tl').toLowerCase();
      c = (c + '').split('|')[0];
      if (!map[c]) c = 'tl';
      if (this.badge) {
        this.badge.classList.remove('mlp-corner-tl','mlp-corner-tr','mlp-corner-br','mlp-corner-bl');
        this.badge.classList.add(map[c]);
      }
    }

    _emitError(e){
      try { this.el.dispatchEvent(new CustomEvent('mlp:error',{ detail:{ error:e } })); } catch(_){}
      if (e && e.name) this.el.setAttribute('data-error', e.name);
    }

    async play(){
      try {
        if (!this.opts.video) return;
        if (this.opts.sound === 'on') this.video.muted = false;
        if (this.video.readyState < 2) await once(this.video,'canplay');
        await this.video.play();
        this.el.classList.add('is-playing','is-zoom');
      } catch(e){ this._emitError(e); }
    }

    pause(){
      if (this.opts.sound !== 'on') this.video.muted = true;
      this.el.classList.remove('is-zoom','is-playing');
      this.video.pause();
    }

    destroy(){
      document.removeEventListener('visibilitychange', this._onVisibility);
      if (this._unbind) this._unbind();
      if (this._io) this._io.disconnect();
      if (this._ioPause) this._ioPause.disconnect();
    }

    static mount(el, opts){
      if (el.__mlp) el.__mlp.destroy();
      const inst = new MiniLivePhoto(el, opts); el.__mlp = inst; return inst;
    }

    static scan(root=document){
      const nodes = Array.from(root.querySelectorAll('[data-livephoto]'));
      return nodes.map(n => MiniLivePhoto.mount(n, {}));
    }
  }

  global.MiniLivePhoto = MiniLivePhoto;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => MiniLivePhoto.scan());
    else MiniLivePhoto.scan();
  }
})(typeof window !== 'undefined' ? window : globalThis);
