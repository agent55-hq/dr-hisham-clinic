/**
 * WhatsAppDirectRouting_STUB.jsx
 * Module: whatsapp_direct_routing
 * SPRINT-001 — Engineer Node (STUB)
 *
 * Scope boundary:
 * - Real WhatsApp number is an Owner action item; non-blocking.
 * - This stub renders a placeholder button and logs the pending dependency.
 */

(function () {
  'use strict';

  const CONFIG = window.TENANT_CONFIG || {};
  const mData = CONFIG.module_data?.whatsapp_direct_routing || {};
  const phone = mData.phone_number || '';

  console.warn(
    '[A55-Module] whatsapp_direct_routing: Module not yet implemented — placeholder rendered. ' +
    'Real module needs phone_number from Owner. Current value:',
    phone || '(none provided)'
  );

  /* ═══ Styles (injected once) ═══ */
  const STYLE_ID = 'a55-wa-stub-style';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .a55-wa-stub {
        padding: 40px 24px;
        text-align: center;
        max-width: 600px;
        margin: 0 auto;
      }
      .a55-wa-stub__btn {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        background: #25d366;
        color: #fff;
        border: none;
        padding: 14px 32px;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        cursor: not-allowed;
        opacity: 0.6;
      }
      .a55-wa-stub__note {
        margin-top: 12px;
        font-family: var(--mono, 'DM Mono', monospace);
        font-size: 11px;
        color: var(--text3, #9e8b78);
        letter-spacing: 0.05em;
      }
    `;
    document.head.appendChild(style);
  }

  function renderStub() {
    const container = document.getElementById('a55-body') || document.getElementById('a55-cta');
    if (!container) return;

    const wrapper = document.createElement('section');
    wrapper.className = 'a55-wa-stub a55-module a55-module--whatsapp_direct_routing';
    wrapper.dataset.moduleId = 'whatsapp_direct_routing';

    const btn = document.createElement('button');
    btn.className = 'a55-wa-stub__btn';
    btn.type = 'button';
    btn.disabled = true;
    btn.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">' +
      '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>' +
      '</svg>' +
      '<span>WhatsApp Direct Routing (Pending)</span>';

    const note = document.createElement('p');
    note.className = 'a55-wa-stub__note';
    note.textContent = 'Waiting for Owner to provide phone_number';

    wrapper.appendChild(btn);
    wrapper.appendChild(note);
    container.appendChild(wrapper);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderStub);
  } else {
    renderStub();
  }
})();
