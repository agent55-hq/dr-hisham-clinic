/**
 * Agent55-OS — OnboardingChatEngine v2.0
 * AI-driven conversational client onboarding portal.
 * All questioning, adaptation, and feature discovery handled by Gemini via proxy.
 * UI layer only: message rendering, typing indicators, progress, export.
 *
 * Runtime: Vanilla JS, injected into a container div by OnboardingPortal.js
 * AI Backend: POSTs to /api/onboarding-chat (Vercel Edge Function → Gemini)
 * Export: JSON + Markdown PRD preview (client-side generation from parsed EXPORT_READY block)
 */

(function () {
  'use strict';

  /* ══ CONFIGURATION ══ */
  const CONFIG = {
    proxyEndpoint: window.ONBOARDING_AI_PROXY || '/api/onboarding-chat',
    tenantId:    window.ONBOARDING_TENANT_ID || 'default',
    maxRetries:  1,
    retryDelay:  1000,
  };

  /* ══ STATE ══ */
  let state = {
    phase:          'chat',       // 'chat' | 'review' | 'complete'
    messages:       [],          // { role: 'user'|'model', content: string }[]
    turnCount:      0,           // AI turns for progress calculation
    parsedData:     null,        // structured data from EXPORT_READY block
    isLoading:      false,
    awaitingUser:   true,
  };

  /* ══ DOM REFERENCES ══ */
  let containerEl = null;
  let messagesEl  = null;
  let inputEl     = null;
  let sendBtn     = null;

  /* ══ INITIALIZATION ══ */
  function init(parentSelector) {
    const parent = document.querySelector(parentSelector);
    if (!parent) {
      console.error('[OnboardingChatEngine] Container not found:', parentSelector);
      return;
    }
    containerEl = parent;
    renderUI(parent);
    bindEvents();
    startConversation();
  }

  function renderUI(parent) {
    parent.innerHTML = '';
    parent.classList.add('onboarding-portal');

    const wrapper = document.createElement('div');
    wrapper.className = 'onboarding-chat-wrapper';
    wrapper.innerHTML = `
      <div class="onboarding-header">
        <h2>Build Your Clinic Website</h2>
        <p>Chat with our AI to design your perfect clinic site.</p>
      </div>
      <div class="onboarding-messages" id="onboarding-messages"></div>
      <div class="onboarding-input-area">
        <textarea
          id="onboarding-input"
          placeholder="Type your answer..."
          rows="2"
        ></textarea>
        <button id="onboarding-send">Send</button>
      </div>
      <div class="onboarding-progress">
        <div class="progress-bar" id="onboarding-progress-bar" style="width:0%"></div>
      </div>
      <div class="onboarding-actions" id="onboarding-actions"></div>
    `;
    parent.appendChild(wrapper);

    messagesEl = wrapper.querySelector('#onboarding-messages');
    inputEl    = wrapper.querySelector('#onboarding-input');
    sendBtn    = wrapper.querySelector('#onboarding-send');

    injectStyles();
  }

  function injectStyles() {
    if (document.getElementById('onboarding-chat-styles')) return;
    const style = document.createElement('style');
    style.id = 'onboarding-chat-styles';
    style.textContent = `
      .onboarding-portal {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        max-width: 720px;
        margin: 0 auto;
        padding: 2rem 1rem;
        color: #1a1410;
        background: #faf8f4;
        min-height: 100vh;
      }
      .onboarding-chat-wrapper {
        display: flex;
        flex-direction: column;
        height: calc(100vh - 4rem);
        gap: 1rem;
      }
      .onboarding-header {
        text-align: center;
        padding-bottom: 1rem;
        border-bottom: 1px solid rgba(184,147,90,0.2);
      }
      .onboarding-header h2 {
        font-family: 'Cormorant Garamond', Georgia, serif;
        font-size: 1.75rem;
        font-weight: 600;
        color: #0B2545;
        margin: 0 0 0.5rem;
      }
      .onboarding-header p {
        font-size: 0.875rem;
        color: #6b5a47;
        margin: 0;
      }
      .onboarding-messages {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 0.5rem 0;
      }
      .msg-bubble {
        max-width: 80%;
        padding: 0.875rem 1.125rem;
        border-radius: 12px;
        font-size: 0.9375rem;
        line-height: 1.6;
        animation: msgFadeIn 0.25s ease;
      }
      @keyframes msgFadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .msg-ai {
        align-self: flex-start;
        background: #ffffff;
        border: 1px solid rgba(184,147,90,0.2);
        color: #2c2218;
        border-bottom-left-radius: 4px;
      }
      .msg-user {
        align-self: flex-end;
        background: #0B2545;
        color: #ffffff;
        border-bottom-right-radius: 4px;
      }
      .msg-typing {
        align-self: flex-start;
        background: transparent;
        border: none;
        padding: 0.5rem 0;
      }
      .typing-dots {
        display: flex;
        gap: 4px;
        align-items: center;
        height: 20px;
      }
      .typing-dots span {
        width: 8px;
        height: 8px;
        background: #b8935a;
        border-radius: 50%;
        animation: typingBounce 1.4s infinite ease-in-out both;
      }
      .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
      .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
      @keyframes typingBounce {
        0%, 80%, 100% { transform: scale(0.4); }
        40% { transform: scale(1); }
      }
      .onboarding-input-area {
        display: flex;
        gap: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid rgba(184,147,90,0.2);
      }
      .onboarding-input-area textarea {
        flex: 1;
        resize: none;
        border: 1px solid rgba(184,147,90,0.3);
        border-radius: 8px;
        padding: 0.75rem 1rem;
        font-family: inherit;
        font-size: 0.9375rem;
        background: #ffffff;
        color: #2c2218;
        outline: none;
        transition: border-color 0.15s;
      }
      .onboarding-input-area textarea:focus {
        border-color: #b8935a;
      }
      .onboarding-input-area textarea:disabled {
        background: #f0ebe3;
        cursor: not-allowed;
      }
      .onboarding-input-area button {
        padding: 0.75rem 1.5rem;
        background: #0B2545;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        font-size: 0.9375rem;
        cursor: pointer;
        transition: opacity 0.15s;
      }
      .onboarding-input-area button:hover:not(:disabled) {
        opacity: 0.88;
      }
      .onboarding-input-area button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .onboarding-progress {
        height: 4px;
        background: rgba(184,147,90,0.15);
        border-radius: 2px;
        overflow: hidden;
      }
      .progress-bar {
        height: 100%;
        background: #b8935a;
        border-radius: 2px;
        transition: width 0.4s ease;
      }
      .onboarding-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        justify-content: center;
      }
      .onboarding-actions button {
        padding: 0.625rem 1.25rem;
        border: 1px solid rgba(184,147,90,0.3);
        background: #fff;
        color: #2c2218;
        border-radius: 6px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.15s;
      }
      .onboarding-actions button:hover {
        border-color: #b8935a;
        background: rgba(184,147,90,0.06);
      }
      .onboarding-actions button.primary {
        background: #0B2545;
        color: #fff;
        border-color: #0B2545;
      }
      .onboarding-actions button.primary:hover {
        opacity: 0.88;
        background: #0B2545;
      }
      .review-section {
        background: #fff;
        border: 1px solid rgba(184,147,90,0.2);
        border-radius: 8px;
        padding: 1rem;
        margin-top: 0.5rem;
      }
      .review-section h4 {
        font-size: 0.9375rem;
        color: #0B2545;
        margin: 0 0 0.75rem;
      }
      .review-section pre {
        font-size: 0.8125rem;
        line-height: 1.5;
        background: #f5f0e8;
        padding: 0.75rem;
        border-radius: 6px;
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .export-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.875rem 1.5rem;
        background: #b8935a;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 0.9375rem;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.15s;
      }
      .export-btn:hover {
        opacity: 0.88;
      }
    `;
    document.head.appendChild(style);
  }

  /* ══ EVENT BINDING ══ */
  function bindEvents() {
    sendBtn.addEventListener('click', onSend);
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    });
  }

  function setInputEnabled(enabled) {
    inputEl.disabled = !enabled;
    sendBtn.disabled = !enabled;
    state.awaitingUser = enabled;
    if (enabled) {
      setTimeout(() => inputEl.focus(), 50);
    }
  }

  /* ══ CONVERSATION ENGINE (AI-DRIVEN) ══ */
  function startConversation() {
    state.phase = 'chat';
    state.messages = [];
    state.turnCount = 0;
    state.parsedData = null;

    // Initial system-turn to get Gemini's opening message — sent silently, no visible bubble
    state.messages.push({ role: 'user', content: 'START_ONBOARDING' });
    sendToProxy();
  }

  function onSend() {
    const val = inputEl.value.trim();
    if (!val || state.isLoading) return;

    inputEl.value = '';
    pushUserMessage(val);
    sendToProxy();
  }

  function pushUserMessage(content) {
    state.messages.push({ role: 'user', content });
    addUserBubble(content);
  }

  function pushModelMessage(content) {
    state.messages.push({ role: 'model', content });
  }

  /* ══ PROXY COMMUNICATION ══ */
  async function sendToProxy(attempt = 0) {
    if (state.phase !== 'chat') return;

    setInputEnabled(false);
    state.isLoading = true;
    showTypingIndicator();

    try {
      const res = await fetch(CONFIG.proxyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: state.messages,
          tenantId: CONFIG.tenantId,
        }),
      });

      hideTypingIndicator();

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Proxy error ${res.status}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.reply) {
        throw new Error('Empty reply from proxy.');
      }

      // Check for EXPORT_READY block
      const exportMatch = data.reply.match(/\[EXPORT_READY\]([\s\S]*?)\[\/EXPORT_READY\]/);

      if (exportMatch) {
        const jsonStr = exportMatch[1].trim();
        let parsed;
        try {
          parsed = JSON.parse(jsonStr);
        } catch (parseErr) {
          console.error('[OnboardingChatEngine] Failed to parse EXPORT_READY block:', parseErr);
          // Strip the block and continue as normal message
          const stripped = data.reply.replace(/\[EXPORT_READY\][\s\S]*?\[\/EXPORT_READY\]/, '').trim();
          pushModelMessage(data.reply); // store raw for completeness
          state.turnCount++;
          updateProgress();
          addAIBubble(stripped || 'I had trouble finalizing your profile. Let me try again.');
          setInputEnabled(true);
          state.isLoading = false;
          return;
        }

        state.parsedData = parsed;
        state.phase = 'review';

        // Strip EXPORT_READY block from display
        const displayText = data.reply.replace(/\[EXPORT_READY\][\s\S]*?\[\/EXPORT_READY\]/, '').trim();
        pushModelMessage(data.reply);
        addAIBubble(displayText || 'All set! Here is your clinic profile.');
        updateProgress(); // will jump to 100%
        transitionToReview();
      } else {
        pushModelMessage(data.reply);
        state.turnCount++;
        updateProgress();
        addAIBubble(data.reply);
        setInputEnabled(true);
      }

      state.isLoading = false;
    } catch (err) {
      hideTypingIndicator();
      console.error('[OnboardingChatEngine] Proxy call failed:', err);

      if (attempt < CONFIG.maxRetries) {
        addAIBubble('Connection hiccup. Retrying...');
        setTimeout(() => sendToProxy(attempt + 1), CONFIG.retryDelay);
        return;
      }

      addAIBubble('Sorry, I\'m having trouble connecting. Please check your internet and try again. [' + err.message + ']');
      setInputEnabled(true);
      state.isLoading = false;
    }
  }

  /* ══ PROGRESS ══ */
  function updateProgress() {
    const bar = document.getElementById('onboarding-progress-bar');
    if (!bar) return;

    let pct;
    if (state.phase === 'review' || state.phase === 'complete') {
      pct = 100;
    } else {
      pct = Math.min(state.turnCount * 6, 80);
    }
    bar.style.width = pct + '%';
  }

  /* ══ REVIEW PHASE ══ */
  function transitionToReview() {
    clearActions();

    const data = state.parsedData;
    if (!data) {
      console.error('[OnboardingChatEngine] No parsed data at review phase.');
      return;
    }

    const jsonPreview = JSON.stringify(data, null, 2);

    const reviewMsg = document.createElement('div');
    reviewMsg.className = 'msg-bubble msg-ai';
    reviewMsg.innerHTML = `
      <p style="margin-bottom:0.75rem">Here's everything we collected for your review:</p>
      <div class="review-section">
        <h4>Your Clinic Profile</h4>
        <pre>${escapeHtml(jsonPreview)}</pre>
      </div>
    `;
    messagesEl.appendChild(reviewMsg);
    scrollToBottom();

    renderActions([
      { label: 'Download JSON', primary: true, onClick: () => downloadExport('json') },
      { label: 'Download PRD Markdown', primary: false, onClick: () => downloadExport('markdown') },
      { label: 'Start Over', primary: false, onClick: () => startConversation() },
    ]);
  }

  function generateMarkdownPRD() {
    const d = state.parsedData || {};
    const pp = d.physician_profile || {};
    const cl = d.clinic || {};
    const mod = d.modules || {};
    return `# PRD: ${cl.name || 'New Clinic Website'}

## 1. Problem Statement
Build a professional clinic website for ${pp.name || 'the physician'}.

## 2. User Stories
- Patients can learn about services and contact the clinic
- The website reflects the physician's brand and credentials

## 3. Out of Scope
- Payment processing
- Real-time appointment booking (unless calendar module selected)

## 4. Data Model Boundaries
### Physician
- Name: ${pp.name || 'TBD'}
- Specialty: ${pp.specialty || 'TBD'}
- Credentials: ${pp.credentials || 'TBD'}

### Clinic
- Name: ${cl.name || 'TBD'}
- Address: ${cl.address || 'TBD'}
- Phone: ${cl.phone || 'TBD'}
- Hours: ${cl.hours || 'TBD'}

## 5. Modules
${(mod.selected || []).map((id) => '- `' + id + '`').join('\n') || '- (none selected)'}

## 6. Custom Features
${(mod.custom || []).map((c) => '- ' + c).join('\n') || '- (none specified)'}

## 7. Runtime & Testing
- Generated via Agent55-OS Onboarding Portal
- Manual review and integration required
`;
  }

  function downloadExport(format) {
    if (!state.parsedData) return;

    let blob, filename;
    if (format === 'json') {
      blob = new Blob([JSON.stringify(state.parsedData, null, 2)], { type: 'application/json' });
      filename = 'clinic-onboarding-data.json';
    } else {
      blob = new Blob([generateMarkdownPRD()], { type: 'text/markdown' });
      filename = 'clinic-prd.md';
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ══ UI HELPERS ══ */
  function addAIBubble(text) {
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble msg-ai';
    bubble.textContent = text;
    messagesEl.appendChild(bubble);
    scrollToBottom();
  }

  function addUserBubble(text) {
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble msg-user';
    bubble.textContent = text;
    messagesEl.appendChild(bubble);
    scrollToBottom();
  }

  function showTypingIndicator() {
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble msg-typing';
    bubble.id = 'typing-indicator';
    bubble.innerHTML = `
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    `;
    messagesEl.appendChild(bubble);
    scrollToBottom();
  }

  function hideTypingIndicator() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function renderActions(actions) {
    const container = document.getElementById('onboarding-actions');
    container.innerHTML = '';
    actions.forEach((act) => {
      const btn = document.createElement('button');
      btn.textContent = act.label;
      if (act.primary) btn.classList.add('primary');
      btn.addEventListener('click', act.onClick);
      container.appendChild(btn);
    });
  }

  function clearActions() {
    const container = document.getElementById('onboarding-actions');
    if (container) container.innerHTML = '';
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ══ PUBLIC API ══ */
  window.OnboardingChatEngine = {
    init,
    getState: () => ({ ...state }),
    export: () => state.parsedData,
  };

  // Auto-init if data-init attribute present
  const autoInit = document.querySelector('[data-onboarding-chat]');
  if (autoInit) {
    init(autoInit.dataset.onboardingChat || '#onboarding-container');
  }
})();
