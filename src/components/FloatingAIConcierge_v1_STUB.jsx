/**
 * FloatingAIConcierge_v1_STUB.jsx
 * Module: floating_ai_concierge_v1
 * SPRINT-001 — Engineer Node (STUB)
 *
 * Core rules:
 * - Fixed-position FAB button outside document flow.
 * - On click: opens a small slide-up tray (placeholder div, no real chat logic).
 * - Close button inside tray.
 * - Uses env(safe-area-inset-bottom) for iPhone notch safety.
 */

(function () {
  'use strict';

  console.warn(
    '[A55-Module] floating_ai_concierge_v1: Module not yet implemented — placeholder rendered.'
  );

  /* ═══ Styles (injected once) ═══ */
  const STYLE_ID = 'a55-concierge-stub-style';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .a55-concierge-fab {
        position: fixed;
        bottom: calc(24px + env(safe-area-inset-bottom, 0px));
        right: 24px;
        z-index: 50;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--primary-color, #0B2545);
        color: #fff;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: transform 0.2s, box-shadow 0.2s;
        font-size: 1.5rem;
      }
      .a55-concierge-fab:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(0,0,0,0.25);
      }
      .a55-concierge-fab:focus-visible {
        outline: 2px solid var(--gold, #b8935a);
        outline-offset: 2px;
      }
      .a55-concierge-tray {
        position: fixed;
        bottom: calc(24px + env(safe-area-inset-bottom, 0px));
        right: 24px;
        z-index: 51;
        width: clamp(280px, 90vw, 360px);
        height: clamp(320px, 50vh, 480px);
        background: var(--warm, #faf8f4);
        border: 1px solid var(--border, rgba(184,147,90,0.2));
        border-radius: 12px;
        box-shadow: 0 12px 40px rgba(0,0,0,0.15);
        display: flex;
        flex-direction: column;
        transform: translateY(20px);
        opacity: 0;
        pointer-events: none;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    opacity 0.3s ease;
      }
      .a55-concierge-tray[aria-hidden="false"] {
        transform: translateY(0);
        opacity: 1;
        pointer-events: auto;
      }
      .a55-concierge-tray__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid var(--border-l, rgba(184,147,90,0.08));
      }
      .a55-concierge-tray__title {
        font-family: var(--serif, 'Cormorant Garamond', Georgia, serif);
        font-size: 1.1rem;
        font-weight: 300;
        color: var(--deep, #1a1410);
      }
      .a55-concierge-tray__close {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: var(--text3, #9e8b78);
        padding: 4px;
        line-height: 1;
      }
      .a55-concierge-tray__body {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        font-size: 14px;
        color: var(--text2, #6b5a47);
        text-align: center;
      }
      @media (max-width: 768px) {
        .a55-concierge-fab {
          bottom: calc(20px + env(safe-area-inset-bottom, 0px));
          right: 20px;
          width: 52px;
          height: 52px;
        }
        .a55-concierge-tray {
          bottom: calc(20px + env(safe-area-inset-bottom, 0px));
          right: 20px;
          width: calc(100vw - 40px);
        }
      }
    `;
    document.head.appendChild(style);
  }

  function renderStub() {
    // FAB button — appended directly to <body>, outside document flow
    const fab = document.createElement('button');
    fab.className = 'a55-concierge-fab a55-module a55-module--floating_ai_concierge_v1';
    fab.dataset.moduleId = 'floating_ai_concierge_v1';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'AI Concierge');
    fab.textContent = '\u{1F916}'; // robot emoji

    // Tray
    const tray = document.createElement('div');
    tray.className = 'a55-concierge-tray';
    tray.setAttribute('role', 'dialog');
    tray.setAttribute('aria-modal', 'true');
    tray.setAttribute('aria-hidden', 'true');
    tray.setAttribute('aria-labelledby', 'a55-concierge-title');

    const header = document.createElement('div');
    header.className = 'a55-concierge-tray__header';

    const title = document.createElement('h3');
    title.id = 'a55-concierge-title';
    title.className = 'a55-concierge-tray__title';
    title.textContent = 'AI Concierge';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'a55-concierge-tray__close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '&times;';

    header.appendChild(title);
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'a55-concierge-tray__body';
    body.textContent = 'AI concierge module coming soon. No real chat logic active in SPRINT-001.';

    tray.appendChild(header);
    tray.appendChild(body);

    // Interaction
    function openTray() {
      tray.setAttribute('aria-hidden', 'false');
      fab.setAttribute('aria-expanded', 'true');
    }
    function closeTray() {
      tray.setAttribute('aria-hidden', 'true');
      fab.setAttribute('aria-expanded', 'false');
    }

    fab.addEventListener('click', openTray);
    closeBtn.addEventListener('click', closeTray);

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && tray.getAttribute('aria-hidden') === 'false') {
        closeTray();
      }
    });

    document.body.appendChild(fab);
    document.body.appendChild(tray);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderStub);
  } else {
    renderStub();
  }
})();
