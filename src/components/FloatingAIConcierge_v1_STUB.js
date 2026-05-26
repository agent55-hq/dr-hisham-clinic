/**
 * FloatingAIConcierge_v1_STUB.js
 * Module: floating_ai_concierge_v1
 * SPRINT-001 — Engineer Node (Demo-Ready Clinic Onboarding Wizard)
 *
 * Core rules:
 * - Fixed-position FAB button outside document flow.
 * - On click: opens a premium slide-up chat tray with pre-scripted mock clinic onboarding flow.
 * - Close button inside tray. Escape key handler.
 * - Uses env(safe-area-inset-bottom) for iPhone notch safety.
 * - 44px minimum touch targets. text-align: start for RTL safety.
 * - No backend. All responses are pre-scripted and timed for demo flow.
 *
 * Purpose: Clinic Digital Assistant — onboarding wizard that helps
 *          patients learn about services and connects them with the clinic.
 */

(function () {
  'use strict';

  const CONFIG = window.TENANT_CONFIG || {};
  const MOD_DATA = CONFIG.module_data?.floating_ai_concierge_v1 || {};

  /* ═════ Pre-scripted clinic onboarding conversation ═════ */
  const SCRIPT = [
    { sender: 'ai',   text: "Welcome to The Specialized First Clinic. I am your Digital Assistant. How may I help you today?", delay: 700 },
    { sender: 'user', text: "I would like to learn about endoscopic sinus surgery and advanced otology.", delay: 1800 },
    { sender: 'ai',   text: "Excellent. Dr. Hisham El-Qaisi specializes in those areas with over 35 years of experience. Would you like to book a consultation or speak with our team via WhatsApp?", delay: 2600 },
    { sender: 'user', text: "I would like to book a consultation.", delay: 1800 },
    { sender: 'ai',   text: "Premium service noted. I am preparing your consultation request now.", delay: 2200 },
    { sender: 'ai',   text: "Your request is complete. Here's your summary: Consultation — Endoscopic Sinus Surgery, Advanced Otology. Contact — WhatsApp Direct or Patient Intake Form. Estimated response time: within 48 hours. Would you like to proceed?", delay: 2800, final: true },
  ];

  /* ═════ Styles (injected once) ═════ */
  const STYLE_ID = 'a55-concierge-demo-style';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .a55-concierge-fab {
        position: fixed;
        bottom: calc(24px + env(safe-area-inset-bottom));
        inset-inline-end: 24px;
        z-index: 50;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--deep, #1a1410);
        color: var(--gold, #b8935a);
        border: 1.5px solid var(--gold, #b8935a);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        transition: transform 0.2s, box-shadow 0.2s;
        font-size: 1.5rem;
      }
      .a55-concierge-fab:hover {
        transform: scale(1.06);
        box-shadow: 0 6px 24px rgba(0,0,0,0.3);
      }
      .a55-concierge-fab:focus-visible {
        outline: 2px solid var(--gold, #b8935a);
        outline-offset: 2px;
      }
      .a55-concierge-tray {
        position: fixed;
        bottom: calc(24px + env(safe-area-inset-bottom));
        inset-inline-end: 24px;
        z-index: 50;
        width: clamp(300px, 92vw, 400px);
        height: clamp(420px, 65vh, 560px);
        background: var(--warm, #faf8f4);
        border: 1px solid var(--border, rgba(184,147,90,0.2));
        border-radius: 16px;
        box-shadow: 0 16px 48px rgba(0,0,0,0.18);
        display: flex;
        flex-direction: column;
        transform: translateY(20px);
        opacity: 0;
        pointer-events: none;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    opacity 0.3s ease;
        overflow: hidden;
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
        background: var(--deep, #1a1410);
        border-bottom: 1px solid rgba(184,147,90,0.25);
        flex-shrink: 0;
      }
      .a55-concierge-tray__header-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .a55-concierge-tray__title {
        font-family: var(--serif, 'Cormorant Garamond', Georgia, serif);
        font-size: clamp(1rem, 3vw, 1.15rem);
        font-weight: 300;
        color: var(--gold, #b8935a);
        letter-spacing: 0.02em;
        line-height: 1.3;
      }
      .a55-concierge-tray__subtitle {
        font-family: var(--arabic, 'Tajawal', sans-serif);
        font-size: clamp(0.65rem, 1.8vw, 0.75rem);
        font-weight: 400;
        color: rgba(184,147,90,0.75);
        text-align: start;
        letter-spacing: 0.04em;
      }
      .a55-concierge-tray__close {
        background: none;
        border: none;
        font-size: 1.4rem;
        cursor: pointer;
        color: var(--gold, #b8935a);
        min-width: 44px;
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        transition: background 0.15s;
      }
      .a55-concierge-tray__close:hover {
        background: rgba(184,147,90,0.12);
      }
      .a55-concierge-tray__body {
        flex: 1;
        overflow-y: auto;
        padding: 16px 18px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        scroll-behavior: smooth;
      }
      .a55-concierge-tray__body::-webkit-scrollbar { width: 4px; }
      .a55-concierge-tray__body::-webkit-scrollbar-thumb {
        background: var(--border, rgba(184,147,90,0.2));
        border-radius: 4px;
      }
      .a55-chat-bubble {
        max-width: 88%;
        padding: 12px 16px;
        border-radius: 14px;
        font-family: var(--arabic, 'Tajawal', sans-serif);
        font-size: clamp(0.82rem, 2.2vw, 0.95rem);
        line-height: 1.55;
        word-wrap: break-word;
        text-align: start;
        animation: a55-bubbleIn 0.35s ease-out both;
      }
      .a55-chat-bubble--ai {
        align-self: flex-start;
        background: #fff;
        color: var(--text, #2c2218);
        border: 1px solid var(--border-l, rgba(184,147,90,0.08));
        border-inline-start: 3px solid rgba(184,147,90,0.35);
        border-end-start-radius: 4px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.04);
      }
      .a55-chat-bubble--user {
        align-self: flex-end;
        background: #ece8e0;
        color: var(--text, #2c2218);
        border-end-end-radius: 4px;
      }
      @keyframes a55-bubbleIn {
        from { opacity: 0; transform: translateY(8px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      .a55-typing {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 10px 14px;
        align-self: flex-start;
        background: #fff;
        border: 1px solid var(--border-l, rgba(184,147,90,0.08));
        border-inline-start: 3px solid rgba(184,147,90,0.35);
        border-radius: 14px;
        border-end-start-radius: 4px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        animation: a55-bubbleIn 0.3s ease-out both;
      }
      .a55-typing__dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--text3, #9e8b78);
        animation: a55-typingDot 1.2s infinite ease-in-out both;
      }
      .a55-typing__dot:nth-child(1) { animation-delay: 0s; }
      .a55-typing__dot:nth-child(2) { animation-delay: 0.18s; }
      .a55-typing__dot:nth-child(3) { animation-delay: 0.36s; }
      @keyframes a55-typingDot {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
        40% { transform: scale(1); opacity: 1; }
      }
      .a55-chat-cta {
        margin-top: 6px;
        align-self: flex-start;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 18px;
        border-radius: 10px;
        background: var(--deep, #1a1410);
        color: var(--gold, #b8935a);
        font-family: var(--arabic, 'Tajawal', sans-serif);
        font-size: clamp(0.82rem, 2.2vw, 0.95rem);
        font-weight: 500;
        border: 1.5px solid var(--gold, #b8935a);
        cursor: pointer;
        transition: transform 0.15s, box-shadow 0.15s;
        animation: a55-bubbleIn 0.35s ease-out both;
        text-decoration: none;
      }
      .a55-chat-cta:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      .a55-chat-cta:active { transform: translateY(0); }
      .a55-chat-cta::before {
        content: '\2197';
        font-size: 0.9em;
      }
      .a55-chat-deploy-cta {
        align-self: center;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 14px 28px;
        border-radius: 12px;
        background: var(--deep, #1a1410);
        color: var(--gold, #b8935a);
        font-family: var(--serif, 'Cormorant Garamond', Georgia, serif);
        font-size: clamp(0.9rem, 2.4vw, 1.05rem);
        font-weight: 500;
        letter-spacing: 0.04em;
        border: 2px solid var(--gold, #b8935a);
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
        animation: a55-bubbleIn 0.4s ease-out both;
        text-decoration: none;
        margin-top: 8px;
        margin-bottom: 4px;
      }
      .a55-chat-deploy-cta:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        background: #0f0a06;
      }
      .a55-chat-deploy-cta:active {
        transform: translateY(0);
      }
      .a55-chat-deploy-cta::after {
        content: '\2192';
        font-size: 1.1em;
        transition: transform 0.2s;
      }
      .a55-chat-deploy-cta:hover::after {
        transform: translateX(3px);
      }
      .a55-concierge-tray__footer {
        flex-shrink: 0;
        padding: 12px 18px;
        border-top: 1px solid var(--border-l, rgba(184,147,90,0.08));
        background: var(--warm, #faf8f4);
      }
      .a55-concierge-tray__input {
        width: 100%;
        padding: 10px 14px;
        border-radius: 10px;
        border: 1px solid var(--border, rgba(184,147,90,0.2));
        background: #fff;
        color: var(--text, #2c2218);
        font-family: var(--arabic, 'Tajawal', sans-serif);
        font-size: clamp(0.8rem, 2.2vw, 0.92rem);
        outline: none;
        cursor: not-allowed;
        opacity: 0.6;
      }
      .a55-concierge-tray__input::placeholder {
        color: var(--text3, #9e8b78);
      }
      @media (max-width: 768px) {
        .a55-concierge-fab {
          bottom: calc(20px + env(safe-area-inset-bottom));
          inset-inline-end: 20px;
          width: 52px;
          height: 52px;
        }
        .a55-concierge-tray {
          bottom: calc(20px + env(safe-area-inset-bottom));
          inset-inline-end: 20px;
          width: calc(100vw - 40px);
          height: clamp(400px, 70vh, 520px);
          border-radius: 14px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /* ═════ Render ═════ */
  function renderChat() {
    // FAB button
    const fab = document.createElement('button');
    fab.className = 'a55-concierge-fab a55-module a55-module--floating_ai_concierge_v1';
    fab.dataset.moduleId = 'floating_ai_concierge_v1';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Clinic Digital Assistant');
    fab.textContent = '\u{2699}';

    // Tray
    const tray = document.createElement('div');
    tray.className = 'a55-concierge-tray';
    tray.setAttribute('role', 'dialog');
    tray.setAttribute('aria-modal', 'true');
    tray.setAttribute('aria-hidden', 'true');
    tray.setAttribute('aria-labelledby', 'a55-concierge-title');

    const header = document.createElement('div');
    header.className = 'a55-concierge-tray__header';

    const headerText = document.createElement('div');
    headerText.className = 'a55-concierge-tray__header-text';

    const title = document.createElement('h3');
    title.id = 'a55-concierge-title';
    title.className = 'a55-concierge-tray__title';
    title.textContent = 'Clinic Digital Assistant';

    const subtitle = document.createElement('span');
    subtitle.className = 'a55-concierge-tray__subtitle';
    subtitle.textContent = 'Patient Services Assistant';

    headerText.appendChild(title);
    headerText.appendChild(subtitle);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'a55-concierge-tray__close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '&times;';

    header.appendChild(headerText);
    header.appendChild(closeBtn);

    const chatBody = document.createElement('div');
    chatBody.className = 'a55-concierge-tray__body';

    const footer = document.createElement('div');
    footer.className = 'a55-concierge-tray__footer';

    const input = document.createElement('input');
    input.className = 'a55-concierge-tray__input';
    input.type = 'text';
    input.disabled = true;
    input.setAttribute('aria-disabled', 'true');
    input.placeholder = 'Demo mode — full interactive support coming in SPRINT-002';

    footer.appendChild(input);

    tray.appendChild(header);
    tray.appendChild(chatBody);
    tray.appendChild(footer);

    // Interaction
    function openTray() {
      tray.setAttribute('aria-hidden', 'false');
      fab.setAttribute('aria-expanded', 'true');
      // Start demo script on first open
      if (!chatBody.dataset.started) {
        chatBody.dataset.started = 'true';
        runDemoScript(chatBody);
      }
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

  /* ═════ Demo script runner ═════ */
  function runDemoScript(container) {
    let index = 0;

    function scrollToBottom() {
      container.scrollTop = container.scrollHeight;
    }

    function showTyping() {
      const existing = container.querySelector('.a55-typing');
      if (existing) existing.remove();

      const typing = document.createElement('div');
      typing.className = 'a55-typing';
      typing.innerHTML = '<span class="a55-typing__dot"></span><span class="a55-typing__dot"></span><span class="a55-typing__dot"></span>';
      container.appendChild(typing);
      scrollToBottom();
      return typing;
    }

    function removeTyping() {
      const existing = container.querySelector('.a55-typing');
      if (existing) existing.remove();
    }

    function addMessage(text, sender) {
      const bubble = document.createElement('div');
      bubble.className = 'a55-chat-bubble a55-chat-bubble--' + sender;
      bubble.textContent = text;
      container.appendChild(bubble);
      scrollToBottom();
    }

    function addDeployCTA() {
      const btn = document.createElement('button');
      btn.className = 'a55-chat-deploy-cta';
      btn.textContent = 'Request Consultation';
      btn.type = 'button';
      btn.addEventListener('click', () => {
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.5';
        // Show confirmation message
        const confirm = document.createElement('div');
        confirm.className = 'a55-chat-bubble a55-chat-bubble--ai';
        confirm.textContent = 'Request submitted. Our team will contact you within 48 hours. Welcome to The Specialized First Clinic.';
        container.appendChild(confirm);
        scrollToBottom();
      });
      container.appendChild(btn);
      scrollToBottom();
    }

    function step() {
      if (index >= SCRIPT.length) return;
      const item = SCRIPT[index];
      index++;

      if (item.sender === 'ai') {
        const typing = showTyping();
        setTimeout(() => {
          removeTyping();
          addMessage(item.text, 'ai');
          if (item.final) addDeployCTA();
          setTimeout(step, item.delay || 1200);
        }, 1400);
      } else {
        setTimeout(() => {
          addMessage(item.text, 'user');
          setTimeout(step, item.delay || 1200);
        }, item.delay || 1000);
      }
    }

    // Kick off
    setTimeout(step, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderChat);
  } else {
    renderChat();
  }
})();
