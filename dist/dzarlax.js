/* dzarlax.dev Design System — Combobox
 * Searchable select with keyboard navigation and clear button.
 *
 * Usage:
 *   <div data-ds-combobox>
 *     <input type="text" placeholder="Search...">
 *     <ul>
 *       <li data-value="food">Food</li>
 *       <li data-value="transport">Transport</li>
 *     </ul>
 *     <input type="hidden" name="category">  <!-- optional: receives value -->
 *   </div>
 *
 * Events:
 *   el.addEventListener('ds:change', e => console.log(e.detail.value, e.detail.label))
 *
 * JS API:
 *   DS.Combobox(el)          — init a single element
 *   DS.init()                — re-init all [data-ds-combobox] on the page
 *   DS.setValue(el, value)   — programmatically select an option by value
 *   DS.clearValue(el)        — programmatically clear selection
 */
(() => {
  'use strict';

  const initCombobox = (el) => {
    if (el._dsCombobox) return;
    el._dsCombobox = true;

    const input = el.querySelector('input[type="text"], input:not([type="hidden"])');
    const list = el.querySelector('ul');
    const hiddenInput = el.querySelector('input[type="hidden"]');
    if (!input || !list) return;

    el.classList.add('ds-combobox');
    input.classList.add('ds-combobox__input');
    input.setAttribute('autocomplete', 'off');
    list.classList.add('ds-combobox__menu');

    let items = Array.from(list.querySelectorAll('li'));
    items.forEach(item => item.classList.add('ds-combobox__item'));

    // ── Clear button ──
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'ds-combobox__clear';
    clearBtn.setAttribute('aria-label', 'Clear');
    clearBtn.textContent = '×';
    el.appendChild(clearBtn);

    let selectedValue = el.dataset.value || '';
    let activeIndex = -1;

    // Set initial display value
    if (selectedValue) {
      const pre = items.find(i => i.dataset.value === selectedValue);
      if (pre) {
        input.value = pre.textContent.trim();
        pre.classList.add('ds-combobox__item--selected');
        el.classList.add('ds-combobox--has-value');
      }
    }

    /* ── helpers ── */

    const visibleItems = () => items.filter(i => i.style.display !== 'none');

    const open = () => {
      el.classList.add('ds-combobox--open');
      filter(input.value);
    };

    const close = () => {
      el.classList.remove('ds-combobox--open');
      activeIndex = -1;
      // Restore display to selected label (or clear if nothing selected)
      if (selectedValue) {
        const sel = items.find(i => i.dataset.value === selectedValue);
        input.value = sel ? sel.textContent.trim() : '';
      } else {
        input.value = '';
      }
    };

    const filter = (query) => {
      const q = (query || '').toLowerCase().trim();
      let count = 0;
      items.forEach(item => {
        const match = !q || item.textContent.toLowerCase().indexOf(q) !== -1;
        item.style.display = match ? '' : 'none';
        if (match) count++;
      });
      // Empty state
      let empty = list.querySelector('.ds-combobox__empty');
      if (count === 0) {
        if (!empty) {
          empty = document.createElement('li');
          empty.className = 'ds-combobox__empty';
          empty.textContent = '—';
          list.appendChild(empty);
        }
        empty.style.display = '';
      } else if (empty) {
        empty.style.display = 'none';
      }
      activeIndex = -1;
    };

    const setActive = (idx) => {
      const vis = visibleItems();
      vis.forEach(i => i.classList.remove('ds-combobox__item--active'));
      if (idx >= 0 && idx < vis.length) {
        vis[idx].classList.add('ds-combobox__item--active');
        vis[idx].scrollIntoView({ block: 'nearest' });
      }
      activeIndex = idx;
    };

    const select = (item) => {
      selectedValue = item.dataset.value;
      input.value = item.textContent.trim();
      if (hiddenInput) hiddenInput.value = selectedValue;
      el.dataset.value = selectedValue;
      items.forEach(i => i.classList.remove('ds-combobox__item--selected'));
      item.classList.add('ds-combobox__item--selected');
      el.classList.remove('ds-combobox--open');
      el.classList.add('ds-combobox--has-value');
      activeIndex = -1;
      el.dispatchEvent(new CustomEvent('ds:change', {
        bubbles: true,
        detail: { value: selectedValue, label: input.value }
      }));
    };

    const clear = () => {
      selectedValue = '';
      input.value = '';
      if (hiddenInput) hiddenInput.value = '';
      el.dataset.value = '';
      items.forEach(i => i.classList.remove('ds-combobox__item--selected'));
      el.classList.remove('ds-combobox--has-value');
      el.classList.remove('ds-combobox--open');
      activeIndex = -1;
      el.dispatchEvent(new CustomEvent('ds:change', {
        bubbles: true,
        detail: { value: '', label: '' }
      }));
    };

    const setValue = (value) => {
      if (!value) { clear(); return; }
      const item = items.find(i => i.dataset.value === value);
      if (item) select(item);
    };

    // Update items in-place without re-initializing (avoids duplicate listeners/buttons)
    const updateItems = (newItems) => {
      list.innerHTML = '';
      items = [];
      newItems.forEach(item => {
        item.classList.add('ds-combobox__item');
        list.appendChild(item);
        items.push(item);
      });
      // Reset state
      selectedValue = '';
      input.value = '';
      if (hiddenInput) hiddenInput.value = '';
      el.dataset.value = '';
      el.classList.remove('ds-combobox--has-value', 'ds-combobox--open');
      activeIndex = -1;
    };

    /* ── events ── */

    input.addEventListener('focus', () => { open(); });

    input.addEventListener('input', () => {
      open();
      filter(input.value);
    });

    input.addEventListener('keydown', (e) => {
      const vis = visibleItems();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!el.classList.contains('ds-combobox--open')) { open(); return; }
        setActive(Math.min(activeIndex + 1, vis.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive(Math.max(activeIndex - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0 && vis[activeIndex]) select(vis[activeIndex]);
      } else if (e.key === 'Escape') {
        close();
        input.blur();
      }
    });

    list.addEventListener('mousedown', (e) => {
      const item = e.target.closest('.ds-combobox__item:not(.ds-combobox__empty)');
      if (item) { e.preventDefault(); select(item); }
    });

    clearBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      clear();
    });

    document.addEventListener('click', (e) => {
      if (!el.contains(e.target)) close();
    });

    // Expose programmatic API on the element
    el._dsComboboxAPI = { setValue, clear, updateItems };
  };

  const init = () => {
    document.querySelectorAll('[data-ds-combobox]').forEach(initCombobox);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.DS = window.DS || {};
  window.DS.Combobox = initCombobox;
  window.DS.init = () => { init(); };
  window.DS.setValue = (el, value) => { if (el && el._dsComboboxAPI) el._dsComboboxAPI.setValue(value); };
  window.DS.clearValue = (el) => { if (el && el._dsComboboxAPI) el._dsComboboxAPI.clear(); };
  window.DS.updateItems = (el, newItems) => { if (el && el._dsComboboxAPI) el._dsComboboxAPI.updateItems(newItems); };
})();
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
(() => {
  'use strict';

  const resolveTarget = (toggle) => {
    const sel = toggle.getAttribute('data-ds-nav-toggle');
    return sel ? document.querySelector(sel) : null;
  };

  const setOpen = (toggle, target, open) => {
    toggle.classList.toggle('active', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (target) target.classList.toggle('active', open);
    document.querySelectorAll('[data-ds-nav-overlay]').forEach(ov => {
      ov.classList.toggle('active', open);
    });
    // Prevent background scrolling on mobile when navigation is open
    document.documentElement.classList.toggle('ds-scroll-lock', open);
  };

  const bindToggle = (toggle) => {
    if (toggle._dsNavDrawer) return;
    toggle._dsNavDrawer = true;

    const target = resolveTarget(toggle);
    if (!target) return;

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = !target.classList.contains('active');
      setOpen(toggle, target, open);
    });

    // Close on outside-click (anywhere that isn't toggle or target).
    document.addEventListener('click', (e) => {
      if (!target.classList.contains('active')) return;
      if (toggle.contains(e.target) || target.contains(e.target)) return;
      setOpen(toggle, target, false);
    });

    // Close on Escape.
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && target.classList.contains('active')) {
        setOpen(toggle, target, false);
        toggle.focus();
      }
    });

    // Overlay click closes too.
    document.querySelectorAll('[data-ds-nav-overlay]').forEach(ov => {
      ov.addEventListener('click', () => {
        setOpen(toggle, target, false);
      });
    });
  };

  const init = () => {
    document.querySelectorAll('[data-ds-nav-toggle]').forEach(bindToggle);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.DS = window.DS || {};
  window.DS.NavDrawer = { init, bind: bindToggle };
})();
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
(() => {
  'use strict';

  const PROVIDERS = {
    telegram: (u, t) => `https://t.me/share/url?url=${enc(u)}&text=${enc(t)}`,
    x: (u, t) => `https://twitter.com/intent/tweet?url=${enc(u)}&text=${enc(t)}`,
    twitter: (u, t) => `https://twitter.com/intent/tweet?url=${enc(u)}&text=${enc(t)}`,
    linkedin: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${enc(u)}`,
    whatsapp: (u, t, x) => `https://wa.me/?text=${enc(`${x || t} ${u}`)}`,
    reddit: (u, t) => `https://www.reddit.com/submit?url=${enc(u)}&title=${enc(t)}`,
    email: (u, t, x) => `mailto:?subject=${enc(t)}&body=${enc((x ? `${x}\n\n` : '') + u)}`
  };

  const enc = (s) => encodeURIComponent(s == null ? '' : String(s));

  const resolve = (btn, container) => {
    const url = btn.getAttribute('data-share-url') || container.getAttribute('data-share-url') || location.href;
    const title = btn.getAttribute('data-share-title') || container.getAttribute('data-share-title') || document.title;
    const text = btn.getAttribute('data-share-text') || container.getAttribute('data-share-text') || title;
    return { url, title, text };
  };

  const showCopied = (btn) => {
    const msg = btn.querySelector('.share__copied');
    if (!msg) return;
    msg.hidden = false;
    btn.classList.add('is-copied');
    clearTimeout(btn._dsShareT);
    btn._dsShareT = setTimeout(() => {
      msg.hidden = true;
      btn.classList.remove('is-copied');
    }, 1600);
  };

  const fallback = (text, done) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      done();
    } catch (e) {
      /* swallow */
    }
    document.body.removeChild(ta);
  };

  const copyText = (text, done) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => {
        fallback(text, done);
      });
      return;
    }
    fallback(text, done);
  };

  const open = (url) => {
    // noopener for security; noreferrer to avoid leaking the article URL via
    // Referer to the share target (some users care).
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleClick = (e) => {
    const btn = e.target.closest('[data-share]');
    if (!btn) return;
    const container = btn.closest('[data-ds-share]');
    if (!container) return;
    const key = btn.getAttribute('data-share');
    const ctx = resolve(btn, container);

    if (key === 'copy') {
      e.preventDefault();
      copyText(ctx.url, () => {
        showCopied(btn);
      });
      return;
    }

    const make = PROVIDERS[key];
    if (!make) return;
    e.preventDefault();
    const href = make(ctx.url, ctx.title, ctx.text);
    if (key === 'email') {
      location.href = href; // mailto: must not go through window.open
    } else {
      open(href);
    }
  };

  const init = (root) => {
    const scope = root || document;
    scope.querySelectorAll('[data-ds-share]').forEach((el) => {
      if (el._dsShare) return;
      el._dsShare = true;
      el.addEventListener('click', handleClick);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
    });
  } else {
    init();
  }

  // Expose a tiny API namespace, merging with whatever is already there.
  const ns = (window.DS = window.DS || {});
  ns.Share = ns.Share || {};
  ns.Share.init = init;
})();
