/* dzarlax.dev Design System — Share buttons
 *
 * Wires `[data-share]` buttons inside a `[data-ds-share]` container.
 *
 * Provider keys (data-share="…"):
 *   telegram | x | twitter | linkedin | whatsapp | reddit | email | copy
 *
 * URL is resolved per-click (so SPA route changes are picked up). Container
 * may override the defaults:
 *   data-share-url    — fallback: location.href
 *   data-share-title  — fallback: document.title
 *   data-share-text   — fallback: data-share-title (used by whatsapp + email body)
 *
 * Buttons may also carry their own data-share-url/title/text — those win
 * over the container.
 *
 * Auto-init on DOMContentLoaded. Re-init dynamically with DS.Share.init().
 *
 * No external dependencies. Uses navigator.clipboard with an execCommand
 * fallback for older browsers / non-secure contexts.
 */
(function () {
  'use strict';

  var PROVIDERS = {
    telegram: function (u, t/*, x*/) {
      return 'https://t.me/share/url?url=' + enc(u) + '&text=' + enc(t);
    },
    x: function (u, t/*, x*/) {
      return 'https://twitter.com/intent/tweet?url=' + enc(u) + '&text=' + enc(t);
    },
    twitter: function (u, t/*, x*/) {
      return 'https://twitter.com/intent/tweet?url=' + enc(u) + '&text=' + enc(t);
    },
    linkedin: function (u/*, t, x*/) {
      return 'https://www.linkedin.com/sharing/share-offsite/?url=' + enc(u);
    },
    whatsapp: function (u, t, x) {
      return 'https://wa.me/?text=' + enc((x || t) + ' ' + u);
    },
    reddit: function (u, t/*, x*/) {
      return 'https://www.reddit.com/submit?url=' + enc(u) + '&title=' + enc(t);
    },
    email: function (u, t, x) {
      return 'mailto:?subject=' + enc(t) + '&body=' + enc((x ? x + '\n\n' : '') + u);
    }
  };

  function enc(s) { return encodeURIComponent(s == null ? '' : String(s)); }

  function resolve(btn, container, key) {
    var url   = btn.getAttribute('data-share-url')   || container.getAttribute('data-share-url')   || location.href;
    var title = btn.getAttribute('data-share-title') || container.getAttribute('data-share-title') || document.title;
    var text  = btn.getAttribute('data-share-text')  || container.getAttribute('data-share-text')  || title;
    return { url: url, title: title, text: text };
  }

  function showCopied(btn) {
    var msg = btn.querySelector('.share__copied');
    if (!msg) return;
    msg.hidden = false;
    btn.classList.add('is-copied');
    clearTimeout(btn._dsShareT);
    btn._dsShareT = setTimeout(function () {
      msg.hidden = true;
      btn.classList.remove('is-copied');
    }, 1600);
  }

  function copyText(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(text, done); });
      return;
    }
    fallback(text, done);
  }

  function fallback(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { /* swallow */ }
    document.body.removeChild(ta);
  }

  function open(url) {
    // noopener for security; noreferrer to avoid leaking the article URL via
    // Referer to the share target (some users care).
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function handleClick(e) {
    var btn = e.target.closest('[data-share]');
    if (!btn) return;
    var container = btn.closest('[data-ds-share]');
    if (!container) return;
    var key = btn.getAttribute('data-share');
    var ctx = resolve(btn, container, key);

    if (key === 'copy') {
      e.preventDefault();
      copyText(ctx.url, function () { showCopied(btn); });
      return;
    }

    var make = PROVIDERS[key];
    if (!make) return;
    e.preventDefault();
    var href = make(ctx.url, ctx.title, ctx.text);
    if (key === 'email') {
      location.href = href;   // mailto: must not go through window.open
    } else {
      open(href);
    }
  }

  function init(root) {
    var scope = root || document;
    scope.querySelectorAll('[data-ds-share]').forEach(function (el) {
      if (el._dsShare) return;
      el._dsShare = true;
      el.addEventListener('click', handleClick);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }

  // Expose a tiny API namespace, merging with whatever is already there.
  var ns = (window.DS = window.DS || {});
  ns.Share = ns.Share || {};
  ns.Share.init = init;
})();
