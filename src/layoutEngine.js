/**
 * Agent55-OS Layout Engine
 * Sprint-001 — Engineer Node (Updated)
 *
 * Core rules:
 * - Reads window.TENANT_CONFIG at runtime.
 * - Completely specialty-blind — no hardcoded medical text, names, or imagery.
 * - Module → component mapping with real scripts for SPRINT-001 modules.
 * - Stubs for modules awaiting Owner action items (WhatsApp, CRM, AI concierge).
 */

(function () {
  'use strict';

  const CONFIG = window.TENANT_CONFIG || {};
  const MODULES = CONFIG.active_modules || [];
  const THEME = CONFIG.theme_tokens || {};

  /* ═══ Layout position registry (DOM ordering) ═══ */
  const POSITION_ORDER = ['hero', 'body', 'cta'];

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

  /* ═══ Component script loader ═══
   * Real component files load themselves into the correct container by
   * querying #a55-hero, #a55-body, #a55-cta, or appending to <body>.
   * The engine's only job is to inject the <script> tag in correct order.
   */
  const COMPONENT_SCRIPTS = {
    hero_consultant_profile:      'src/components/HeroConsultantProfile.jsx',
    ent_clinical_accordion:       'src/components/ClinicalAccordion.jsx',
    whatsapp_direct_routing:      'src/components/WhatsAppDirectRouting_STUB.jsx',
    patient_intake_triage_v1:     'src/components/PatientIntakeTriage_CRM_v1_STUB.jsx',
    floating_ai_concierge_v1:     'src/components/FloatingAIConcierge_v1_STUB.jsx',
  };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src="' + src + '"]');
      if (existing) { resolve(); return; }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        console.error('[A55-LayoutEngine] Failed to load', src);
        reject(new Error('Failed to load ' + src));
      };
      document.head.appendChild(script);
    });
  }

  /* ═══ Apply CSS custom properties from theme_tokens ═══ */
  function injectThemeTokens() {
    const root = document.documentElement;
    if (THEME.primary_color)   root.style.setProperty('--primary-color', THEME.primary_color);
    if (THEME.secondary_color) root.style.setProperty('--secondary-color', THEME.secondary_color);
    if (THEME.typography)      root.style.setProperty('--font-family', THEME.typography);
  }

  /* ═══ Main layout orchestrator ═══ */
  async function renderLayout() {
    injectThemeTokens();

    // Group modules by position
    const grouped = { hero: [], body: [], cta: [], floating: [] };
    MODULES.forEach((id) => {
      const pos = getLayoutPosition(id);
      (grouped[pos] || grouped.body).push(id);
    });

    // Build ordered list: hero -> body -> cta -> floating
    const ordered = [];
    POSITION_ORDER.forEach((pos) => ordered.push(...grouped[pos]));
    ordered.push(...grouped.floating);

    // Load component scripts sequentially to preserve DOM order
    for (const id of ordered) {
      const src = COMPONENT_SCRIPTS[id];
      if (src) {
        try {
          await loadScript(src);
          console.info('[A55-LayoutEngine] Loaded module:', id);
        } catch (err) {
          console.warn('[A55-LayoutEngine] Module', id, 'failed to load — rendering placeholder.');
          renderPlaceholderFor(id);
        }
      } else {
        console.warn('[A55-LayoutEngine] No script mapped for module:', id);
        renderPlaceholderFor(id);
      }
    }

    console.info('[A55-LayoutEngine] Rendered modules:', MODULES);
  }

  /* ═══ Fallback placeholder renderer ═══ */
  function renderPlaceholderFor(moduleId) {
    const pos = getLayoutPosition(moduleId);
    const container = pos === 'floating' ? document.body : document.getElementById('a55-' + pos);
    if (!container) return;

    const node = document.createElement('section');
    node.className = 'a55-module a55-module--' + moduleId;
    node.dataset.moduleId = moduleId;

    const title = document.createElement('h2');
    title.textContent = moduleId;
    title.style.cssText = 'font-family:sans-serif;font-size:1.25rem;font-weight:600;margin:0 0 0.5rem';

    const desc = document.createElement('p');
    desc.textContent = '[Placeholder — script failed to load]';
    desc.style.cssText = 'font-family:sans-serif;font-size:0.875rem;opacity:0.6;margin:0';

    node.appendChild(title);
    node.appendChild(desc);

    if (pos === 'floating') {
      document.body.appendChild(node);
    } else {
      container.appendChild(node);
    }
  }

  /* ═══ Boot ═══ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderLayout);
  } else {
    renderLayout();
  }
})();
