/* dzarlax.dev Design System — Nav drawer toggle
 *
 * Wires a hamburger button to a slide-out `.navbar--pill` (or any element
 * that uses `.active` as its open state).
 *
 * Usage:
 *   <button class="hamburger" data-ds-nav-toggle="#mainNav" aria-controls="mainNav" aria-expanded="false">
 *     <span class="hamburger__line"></span>
 *     <span class="hamburger__line"></span>
 *     <span class="hamburger__line"></span>
 *   </button>
 *   <nav id="mainNav" class="navbar navbar--pill">...</nav>
 *
 * Optional backdrop: any `[data-ds-nav-overlay]` element gets `.active` in
 * sync with the drawer.
 *
 * Auto-init on DOMContentLoaded. Re-init with `DS.NavDrawer.init()` after
 * dynamic DOM changes.
 *
 * Behavior:
 *   • Click toggle  → flip `.active` on toggle + target + overlay
 *   • Click outside the drawer (but not the toggle) → close
 *   • Escape key → close
 *   • aria-expanded reflects state
 */
(function () {
  'use strict';

  function resolveTarget(toggle) {
    var sel = toggle.getAttribute('data-ds-nav-toggle');
    return sel ? document.querySelector(sel) : null;
  }

  function setOpen(toggle, target, open) {
    toggle.classList.toggle('active', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (target) target.classList.toggle('active', open);
    document.querySelectorAll('[data-ds-nav-overlay]').forEach(function (ov) {
      ov.classList.toggle('active', open);
    });
  }

  function bindToggle(toggle) {
    if (toggle._dsNavDrawer) return;
    toggle._dsNavDrawer = true;

    var target = resolveTarget(toggle);
    if (!target) return;

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !target.classList.contains('active');
      setOpen(toggle, target, open);
    });

    // Close on outside-click (anywhere that isn't toggle or target).
    document.addEventListener('click', function (e) {
      if (!target.classList.contains('active')) return;
      if (toggle.contains(e.target) || target.contains(e.target)) return;
      setOpen(toggle, target, false);
    });

    // Close on Escape.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && target.classList.contains('active')) {
        setOpen(toggle, target, false);
        toggle.focus();
      }
    });

    // Overlay click closes too.
    document.querySelectorAll('[data-ds-nav-overlay]').forEach(function (ov) {
      ov.addEventListener('click', function () {
        setOpen(toggle, target, false);
      });
    });
  }

  function init() {
    document.querySelectorAll('[data-ds-nav-toggle]').forEach(bindToggle);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.DS = window.DS || {};
  window.DS.NavDrawer = { init: init, bind: bindToggle };
}());
