/**
 * Agent55-OS Layout Engine
 * Sprint-001 Scaffold
 *
 * Core rules:
 * - Reads window.TENANT_CONFIG at runtime.
 * - Completely specialty-blind — no hardcoded medical text, names, or imagery.
 * - Module mapping is stub-only; CTO will deliver moduleRegistry.js later.
 */

(function () {
  'use strict';

  const CONFIG = window.TENANT_CONFIG || {};
  const MODULES = CONFIG.active_modules || [];
  const THEME = CONFIG.theme_tokens || {};

  /* ─── Layout position registry (DOM ordering) ─── */
  const POSITION_ORDER = ['hero', 'body', 'cta'];

  /* ─── Stub: module → layout position mapping ───
   * CTO will replace this with moduleRegistry.js in a later commit.
   * For now, every unknown module lands in 'body'.
   */
  function getLayoutPosition(moduleId) {
    const map = {
      hero_consultant_profile: 'hero',
      ent_clinical_accordion: 'body',
      whatsapp_direct_routing: 'body',
      patient_intake_triage_v1: 'body',
      floating_ai_concierge_v1: 'floating',
    };
    return map[moduleId] || 'body';
  }

  /* ─── Stub: module → component renderer ───
   * Returns a minimal placeholder DOM node so the engine is testable
   * before real UI components land.
   */
  function createModulePlaceholder(moduleId) {
    const node = document.createElement('section');
    node.className = `a55-module a55-module--${moduleId}`;
    node.dataset.moduleId = moduleId;

    const title = document.createElement('h2');
    title.textContent = moduleId; // Specialty-blind: only shows the module ID
    title.style.cssText = 'font-family:sans-serif;font-size:1.25rem;font-weight:600;margin:0 0 0.5rem';

    const desc = document.createElement('p');
    desc.textContent = '[Placeholder — component delivered by CTO in later commit]';
    desc.style.cssText = 'font-family:sans-serif;font-size:0.875rem;opacity:0.6;margin:0';

    node.appendChild(title);
    node.appendChild(desc);

    // Stub: patient_intake_triage_v1 submit-button guard
    if (moduleId === 'patient_intake_triage_v1') {
      const consentRow = document.createElement('div');
      consentRow.style.cssText = 'margin-top:1rem;display:flex;align-items:center;gap:0.5rem';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'a55-consent-check';

      const label = document.createElement('label');
      label.htmlFor = 'a55-consent-check';
      label.textContent = 'I consent to the privacy policy.';

      const submit = document.createElement('button');
      submit.type = 'button';
      submit.textContent = 'Submit';
      submit.disabled = true;
      submit.style.cssText = 'margin-left:auto;padding:0.5rem 1rem';

      // Disable submit until consent is checked
      checkbox.addEventListener('change', () => {
        submit.disabled = !checkbox.checked;
      });

      consentRow.appendChild(checkbox);
      consentRow.appendChild(label);
      consentRow.appendChild(submit);
      node.appendChild(consentRow);
    }

    // Stub: floating_ai_concierge_v1 fixed-position styling
    if (moduleId === 'floating_ai_concierge_v1') {
      node.style.cssText =
        'position:fixed;bottom:24px;right:24px;z-index:50;' +
        'width:56px;height:56px;border-radius:50%;' +
        'background:var(--primary-color);color:#fff;' +
        'display:flex;align-items:center;justify-content:center;' +
        'cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
      node.setAttribute('aria-label', 'AI concierge');
      node.innerHTML = '<span style="font-size:1.5rem">🤖</span>';
      // Override the generic placeholder content for the floating widget
    }

    // Stub: whatsapp_direct_routing anchor
    if (moduleId === 'whatsapp_direct_routing') {
      const data = CONFIG.module_data?.whatsapp_direct_routing || {};
      const phone = data.phone_number || '';
      const msg = encodeURIComponent(data.prefilled_message || '');
      const href = phone
        ? `https://wa.me/${phone.replace(/\D/g, '')}${msg ? '?text=' + msg : ''}`
        : '#';

      const link = document.createElement('a');
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Open WhatsApp';
      link.style.cssText =
        'display:inline-block;margin-top:0.75rem;padding:0.5rem 1rem;' +
        'background:#25d366;color:#fff;border-radius:4px;text-decoration:none;font-size:0.875rem';
      node.appendChild(link);
    }

    return node;
  }

  /* ─── Apply CSS custom properties from theme_tokens ─── */
  function injectThemeTokens() {
    const root = document.documentElement;
    if (THEME.primary_color) root.style.setProperty('--primary-color', THEME.primary_color);
    if (THEME.secondary_color) root.style.setProperty('--secondary-color', THEME.secondary_color);
    if (THEME.typography) root.style.setProperty('--font-family', THEME.typography);
  }

  /* ─── Main layout orchestrator ─── */
  function renderLayout() {
    injectThemeTokens();

    const grouped = { hero: [], body: [], cta: [], floating: [] };

    MODULES.forEach((id) => {
      const pos = getLayoutPosition(id);
      (grouped[pos] || grouped.body).push(id);
    });

    // Render into semantic containers
    POSITION_ORDER.forEach((pos) => {
      const container = document.getElementById(`a55-${pos}`);
      if (!container) return;
      grouped[pos].forEach((id) => {
        container.appendChild(createModulePlaceholder(id));
      });
    });

    // Append floating modules directly to <body>, outside document flow
    grouped.floating.forEach((id) => {
      document.body.appendChild(createModulePlaceholder(id));
    });

    console.info('[A55-LayoutEngine] Rendered modules:', MODULES);
  }

  /* ─── Boot ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderLayout);
  } else {
    renderLayout();
  }
})();
