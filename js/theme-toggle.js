/* dzarlax.dev Design System — Theme toggle
 *
 * Auto-wires `[data-ds-theme-toggle]` elements (typically the .theme-toggle
 * button itself) to flip the canonical two-attribute pair on <html>:
 *
 *   <html dark-mode>  — force dark
 *   <html light-mode> — force light
 *
 * Always sets exactly one of the two so the DS's
 *   @media (prefers-color-scheme: dark) :root:not([light-mode]) { ... }
 * fallback never silently overrides the user's manual choice on devices
 * whose system pref disagrees. See CLAUDE.md "Dark mode" for the trap
 * this avoids.
 *
 * Storage key defaults to 'theme'. Override per-element with the attribute
 * value:
 *
 *   <button class="theme-toggle" data-ds-theme-toggle aria-label="..."></button>
 *   <button class="theme-toggle" data-ds-theme-toggle="my-theme-key"></button>
 *
 * Listens to live system-pref changes while no manual override is stored.
 *
 * For FOUC-free initial paint, ship a tiny inline script in the page <head>
 * BEFORE this bundle loads that resolves the same state and sets the
 * attribute. See CLAUDE.md "Dark mode" for the canonical snippet.
 *
 * Auto-init on DOMContentLoaded. Re-init dynamically with DS.Theme.init().
 * Programmatic flip with DS.Theme.apply('dark' | 'light').
 *
 * No external dependencies.
 */
(function () {
  'use strict';

  var ROOT = document.documentElement;
  var DEFAULT_KEY = 'theme';
  var mqDark = window.matchMedia('(prefers-color-scheme: dark)');

  function getKey(el) {
    var v = el && el.getAttribute('data-ds-theme-toggle');
    return v && v.length > 0 ? v : DEFAULT_KEY;
  }

  function read(key) {
    try {
      var v = localStorage.getItem(key);
      if (v === 'dark' || v === 'light') return v;
    } catch (_) {}
    return null;
  }

  function write(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
  }

  function apply(theme) {
    if (theme === 'dark') {
      ROOT.setAttribute('dark-mode', '');
      ROOT.removeAttribute('light-mode');
    } else {
      ROOT.setAttribute('light-mode', '');
      ROOT.removeAttribute('dark-mode');
    }
  }

  function resolveInitial(key) {
    return read(key) || (mqDark.matches ? 'dark' : 'light');
  }

  // Safari < 14 (and iOS Safari < 14) only support the deprecated
  // MediaQueryList.addListener / removeListener — calling .addEventListener
  // on those instances throws. Feature-detect both paths.
  function onMqChange(mq, fn) {
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', fn);
    } else if (typeof mq.addListener === 'function') {
      mq.addListener(fn);
    }
  }

  function handleClick(e) {
    var key = getKey(e.currentTarget);
    var next = ROOT.hasAttribute('dark-mode') ? 'light' : 'dark';
    apply(next);
    write(key, next);
  }

  function init(root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll('[data-ds-theme-toggle]');
    if (!nodes.length) return;

    // Sync attribute on init. Multiple toggles on one page should share a
    // single storage key — first node wins.
    var key = getKey(nodes[0]);
    apply(resolveInitial(key));

    nodes.forEach(function (el) {
      if (el._dsTheme) return;
      el._dsTheme = true;
      el.addEventListener('click', handleClick);
    });

    if (!init._mqWired) {
      init._mqWired = true;
      onMqChange(mqDark, function (e) {
        if (read(key)) return; // user has a manual override
        apply(e.matches ? 'dark' : 'light');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }

  var ns = (window.DS = window.DS || {});
  ns.Theme = ns.Theme || {};
  ns.Theme.init = init;
  ns.Theme.apply = apply;
})();
