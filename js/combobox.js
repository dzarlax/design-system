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
