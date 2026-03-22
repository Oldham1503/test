/* modal.js — Generic modal system */

const Modal = (() => {
  let overlay, box, titleEl, bodyEl, actionsEl, closeBtn;

  function _ensure() {
    if (overlay) return;
    overlay    = document.getElementById('modal-overlay');
    box        = document.getElementById('modal-box');
    titleEl    = document.getElementById('modal-title');
    bodyEl     = document.getElementById('modal-body');
    actionsEl  = document.getElementById('modal-actions');
    closeBtn   = document.getElementById('modal-close');

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  /**
   * openModal({
   *   title:  string,
   *   body:   string (HTML) or HTMLElement,
   *   type:   'success' | 'error' | 'warning' | 'info',
   *   actions: [{ label, primary, onClick }]
   * })
   */
  function open({ title = '', body = '', type = 'info', actions = [] } = {}) {
    _ensure();

    // Type class on box
    box.className = '';
    if (type) box.classList.add(`modal-${type}`);

    titleEl.textContent = title;

    if (typeof body === 'string') {
      bodyEl.innerHTML = body;
    } else {
      bodyEl.innerHTML = '';
      bodyEl.appendChild(body);
    }

    actionsEl.innerHTML = '';
    if (actions.length === 0) {
      const btn = _makeBtn('Close', false, close);
      actionsEl.appendChild(btn);
    } else {
      actions.forEach(a => {
        const btn = _makeBtn(a.label, a.primary, () => {
          if (a.onClick) a.onClick();
          if (a.close !== false) close();
        });
        actionsEl.appendChild(btn);
      });
    }

    overlay.classList.add('visible');
    // Focus first action button
    setTimeout(() => {
      const firstBtn = actionsEl.querySelector('button');
      if (firstBtn) firstBtn.focus();
    }, 50);
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('visible');
  }

  function _makeBtn(label, primary, onClick) {
    const btn = document.createElement('button');
    btn.className = primary ? 'btn btn-primary' : 'btn btn-ghost';
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }

  // Convenience helpers
  function success(title, body, actions) { open({ title, body, type: 'success', actions }); }
  function error(title, body, actions)   { open({ title, body, type: 'error',   actions }); }
  function info(title, body, actions)    { open({ title, body, type: 'info',    actions }); }
  function warning(title, body, actions) { open({ title, body, type: 'warning', actions }); }

  return { open, close, success, error, info, warning };
})();
