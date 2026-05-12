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
(function () {
  'use strict';

  function initCombobox(el) {
    if (el._dsCombobox) return;
    el._dsCombobox = true;

    var input       = el.querySelector('input[type="text"], input:not([type="hidden"])');
    var list        = el.querySelector('ul');
    var hiddenInput = el.querySelector('input[type="hidden"]');
    if (!input || !list) return;

    el.classList.add('ds-combobox');
    input.classList.add('ds-combobox__input');
    input.setAttribute('autocomplete', 'off');
    list.classList.add('ds-combobox__menu');

    var items = Array.from(list.querySelectorAll('li'));
    items.forEach(function (item) { item.classList.add('ds-combobox__item'); });

    // ── Clear button ──
    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'ds-combobox__clear';
    clearBtn.setAttribute('aria-label', 'Clear');
    clearBtn.textContent = '×';
    el.appendChild(clearBtn);

    var selectedValue = el.dataset.value || '';
    var activeIndex   = -1;

    // Set initial display value
    if (selectedValue) {
      var pre = items.find(function (i) { return i.dataset.value === selectedValue; });
      if (pre) {
        input.value = pre.textContent.trim();
        pre.classList.add('ds-combobox__item--selected');
        el.classList.add('ds-combobox--has-value');
      }
    }

    /* ── helpers ── */

    function visibleItems() {
      return items.filter(function (i) { return i.style.display !== 'none'; });
    }

    function open() {
      el.classList.add('ds-combobox--open');
      filter(input.value);
    }

    function close() {
      el.classList.remove('ds-combobox--open');
      activeIndex = -1;
      // Restore display to selected label (or clear if nothing selected)
      if (selectedValue) {
        var sel = items.find(function (i) { return i.dataset.value === selectedValue; });
        input.value = sel ? sel.textContent.trim() : '';
      } else {
        input.value = '';
      }
    }

    function filter(query) {
      var q = (query || '').toLowerCase().trim();
      var count = 0;
      items.forEach(function (item) {
        var match = !q || item.textContent.toLowerCase().indexOf(q) !== -1;
        item.style.display = match ? '' : 'none';
        if (match) count++;
      });
      // Empty state
      var empty = list.querySelector('.ds-combobox__empty');
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
    }

    function setActive(idx) {
      var vis = visibleItems();
      vis.forEach(function (i) { i.classList.remove('ds-combobox__item--active'); });
      if (idx >= 0 && idx < vis.length) {
        vis[idx].classList.add('ds-combobox__item--active');
        vis[idx].scrollIntoView({ block: 'nearest' });
      }
      activeIndex = idx;
    }

    function select(item) {
      selectedValue = item.dataset.value;
      input.value   = item.textContent.trim();
      if (hiddenInput) hiddenInput.value = selectedValue;
      el.dataset.value = selectedValue;
      items.forEach(function (i) { i.classList.remove('ds-combobox__item--selected'); });
      item.classList.add('ds-combobox__item--selected');
      el.classList.remove('ds-combobox--open');
      el.classList.add('ds-combobox--has-value');
      activeIndex = -1;
      el.dispatchEvent(new CustomEvent('ds:change', {
        bubbles: true,
        detail: { value: selectedValue, label: input.value }
      }));
    }

    function clear() {
      selectedValue = '';
      input.value   = '';
      if (hiddenInput) hiddenInput.value = '';
      el.dataset.value = '';
      items.forEach(function (i) { i.classList.remove('ds-combobox__item--selected'); });
      el.classList.remove('ds-combobox--has-value');
      el.classList.remove('ds-combobox--open');
      activeIndex = -1;
      el.dispatchEvent(new CustomEvent('ds:change', {
        bubbles: true,
        detail: { value: '', label: '' }
      }));
    }

    function setValue(value) {
      if (!value) { clear(); return; }
      var item = items.find(function (i) { return i.dataset.value === value; });
      if (item) select(item);
    }

    // Update items in-place without re-initializing (avoids duplicate listeners/buttons)
    function updateItems(newItems) {
      list.innerHTML = '';
      items = [];
      newItems.forEach(function (item) {
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
    }

    /* ── events ── */

    input.addEventListener('focus', function () { open(); });

    input.addEventListener('input', function () {
      open();
      filter(this.value);
    });

    input.addEventListener('keydown', function (e) {
      var vis = visibleItems();
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

    list.addEventListener('mousedown', function (e) {
      var item = e.target.closest('.ds-combobox__item:not(.ds-combobox__empty)');
      if (item) { e.preventDefault(); select(item); }
    });

    clearBtn.addEventListener('mousedown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      clear();
    });

    document.addEventListener('click', function (e) {
      if (!el.contains(e.target)) close();
    });

    // Expose programmatic API on the element
    el._dsComboboxAPI = { setValue: setValue, clear: clear, updateItems: updateItems };
  }

  function init() {
    document.querySelectorAll('[data-ds-combobox]').forEach(initCombobox);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.DS = window.DS || {};
  window.DS.Combobox  = initCombobox;
  window.DS.init      = function () { init(); };
  window.DS.setValue   = function (el, value) { if (el && el._dsComboboxAPI) el._dsComboboxAPI.setValue(value); };
  window.DS.clearValue = function (el) { if (el && el._dsComboboxAPI) el._dsComboboxAPI.clear(); };
  window.DS.updateItems = function (el, newItems) { if (el && el._dsComboboxAPI) el._dsComboboxAPI.updateItems(newItems); };
}());
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
