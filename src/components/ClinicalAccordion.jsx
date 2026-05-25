/**
 * ClinicalAccordion.jsx
 * Module: ent_clinical_accordion
 * SPRINT-001 — Engineer Node
 *
 * Core rules:
 * - Completely specialty-blind: no hardcoded medical text or imagery.
 * - Reads data from window.TENANT_CONFIG at runtime.
 * - Accordion interaction with smooth CSS transitions.
 * - Keyboard navigable: arrow keys, Enter/Space to toggle.
 * - Mobile-first: full-width cards; desktop: grid or side accordion.
 */

(function () {
  'use strict';

  const CONFIG = window.TENANT_CONFIG || {};

  /* ═══ Data resolution ═══ */
  let specializations = [];
  const mData = CONFIG.module_data?.ent_clinical_accordion;
  if (mData && Array.isArray(mData.specializations)) {
    specializations = mData.specializations;
  } else if (typeof CONFIG.specialization === 'string' && CONFIG.specialization) {
    specializations = [{ title: CONFIG.specialization, description: '' }];
  }

  // Mock fallback (only when config provides nothing usable)
  if (!specializations.length) {
    specializations = [
      {
        title: 'Advanced Otology',
        description: 'Comprehensive care for hearing loss, chronic ear infections, and vestibular disorders. Surgical expertise in tympanoplasty, mastoidectomy, and cochlear implant candidacy assessment.'
      },
      {
        title: 'Rhinology',
        description: 'Expert management of nasal obstruction, allergic rhinitis, and chronic sinusitis. Advanced endoscopic techniques for minimally invasive sinus surgery and skull base access.'
      },
      {
        title: 'Endoscopic Sinus Surgery',
        description: 'State-of-the-art functional endoscopic sinus surgery (FESS) for chronic rhinosinusitis, nasal polyps, and fungal sinus disease. Image-guided navigation for complex revision cases.'
      },
    ];
  }

  /* ═══ Styles (injected once) ═══ */
  const STYLE_ID = 'a55-accordion-style';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .a55-accordion {
        padding: 80px 24px;
        max-width: 1100px;
        margin: 0 auto;
      }
      .a55-accordion__label {
        font-family: var(--mono, 'DM Mono', monospace);
        font-size: 10px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--gold, #b8935a);
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .a55-accordion__label::after {
        content: '';
        flex: 1;
        max-width: 60px;
        height: 1px;
        background: var(--gold, #b8935a);
        opacity: 0.4;
      }
      .a55-accordion__heading {
        font-family: var(--serif, 'Cormorant Garamond', Georgia, serif);
        font-size: clamp(2rem, 4vw, 3.2rem);
        font-weight: 300;
        color: var(--deep, #1a1410);
        line-height: 1.2;
        margin-bottom: 48px;
      }
      .a55-accordion__grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 2px;
        border: 1px solid var(--border, rgba(184,147,90,0.2));
      }
      @media (min-width: 769px) {
        .a55-accordion__grid {
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        }
      }
      .a55-accordion__card {
        background: var(--warm, #faf8f4);
        border: none;
        text-align: start;
        cursor: pointer;
        padding: 0;
        transition: background 0.25s ease;
        position: relative;
        overflow: hidden;
      }
      .a55-accordion__card:hover,
      .a55-accordion__card:focus {
        background: var(--ivory, #f5f0e8);
        outline: none;
      }
      .a55-accordion__card:focus-visible {
        box-shadow: inset 0 0 0 2px var(--gold, #b8935a);
      }
      .a55-accordion__card::before {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--gold, #b8935a);
        transform: scaleX(0);
        transition: transform 0.3s ease;
      }
      .a55-accordion__card[aria-expanded="true"]::before,
      .a55-accordion__card:hover::before {
        transform: scaleX(1);
      }
      .a55-accordion__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 28px 24px;
        width: 100%;
        border: none;
        background: transparent;
        cursor: pointer;
        color: var(--deep, #1a1410);
        font-family: var(--serif, 'Cormorant Garamond', Georgia, serif);
        font-size: clamp(1.1rem, 2.5vw, 1.4rem);
        font-weight: 300;
        line-height: 1.4;
        text-align: inherit;
      }
      .a55-accordion__header:focus-visible { outline: none; }
      .a55-accordion__num {
        font-family: var(--mono, 'DM Mono', monospace);
        font-size: 11px;
        color: var(--gold, #b8935a);
        letter-spacing: 0.1em;
        opacity: 0.6;
        flex-shrink: 0;
      }
      .a55-accordion__chevron {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        transition: transform 0.3s ease;
        color: var(--gold, #b8935a);
      }
      .a55-accordion__card[aria-expanded="true"] .a55-accordion__chevron {
        transform: rotate(180deg);
      }
      .a55-accordion__body {
        display: grid;
        grid-template-rows: 0fr;
        transition: grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                    opacity 0.3s ease;
        opacity: 0;
      }
      .a55-accordion__body .inner {
        overflow: hidden;
      }
      .a55-accordion__card[aria-expanded="true"] .a55-accordion__body {
        grid-template-rows: 1fr;
        opacity: 1;
      }
      .a55-accordion__desc {
        font-family: var(--arabic, 'Tajawal', sans-serif);
        font-size: clamp(0.9rem, 2vw, 1rem);
        line-height: 1.7;
        color: var(--text2, #6b5a47);
        padding: 0 24px 28px;
        max-width: 72ch;
      }
      @media (max-width: 768px) {
        .a55-accordion { padding: 60px 20px; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ═══ Render ═══ */
  function renderAccordion() {
    const container = document.getElementById('a55-body');
    if (!container) return;

    const wrapper = document.createElement('section');
    wrapper.className = 'a55-accordion a55-module a55-module--ent_clinical_accordion';
    wrapper.dataset.moduleId = 'ent_clinical_accordion';

    const label = document.createElement('div');
    label.className = 'a55-accordion__label';
    label.textContent = 'Clinical Specializations';

    const heading = document.createElement('h2');
    heading.className = 'a55-accordion__heading';
    heading.textContent = 'Clinical Excellence \u2014 Areas of Practice';

    const grid = document.createElement('div');
    grid.className = 'a55-accordion__grid';

    specializations.forEach((item, index) => {
      const card = document.createElement('article');
      card.className = 'a55-accordion__card';
      card.setAttribute('role', 'region');
      card.setAttribute('aria-expanded', 'false');

      const header = document.createElement('button');
      header.className = 'a55-accordion__header';
      header.type = 'button';
      header.setAttribute('aria-expanded', 'false');
      header.setAttribute('aria-controls', 'a55-acc-body-' + index);
      header.setAttribute('id', 'a55-acc-header-' + index);
      header.tabIndex = 0;

      const num = document.createElement('span');
      num.className = 'a55-accordion__num';
      num.textContent = String(index + 1).padStart(2, '0');

      const title = document.createElement('span');
      title.style.flex = '1';
      title.textContent = item.title || '';

      const chevron = document.createElement('svg');
      chevron.setAttribute('viewBox', '0 0 24 24');
      chevron.setAttribute('fill', 'none');
      chevron.setAttribute('stroke', 'currentColor');
      chevron.setAttribute('stroke-width', '2');
      chevron.setAttribute('stroke-linecap', 'round');
      chevron.setAttribute('stroke-linejoin', 'round');
      chevron.className = 'a55-accordion__chevron';
      chevron.innerHTML = '<polyline points="6 9 12 15 18 9"></polyline>';

      header.appendChild(num);
      header.appendChild(title);
      header.appendChild(chevron);

      const body = document.createElement('div');
      body.className = 'a55-accordion__body';
      body.id = 'a55-acc-body-' + index;
      body.setAttribute('role', 'region');
      body.setAttribute('aria-labelledby', 'a55-acc-header-' + index);

      const inner = document.createElement('div');
      inner.className = 'inner';

      const desc = document.createElement('p');
      desc.className = 'a55-accordion__desc';
      desc.textContent = item.description || '';

      inner.appendChild(desc);
      body.appendChild(inner);

      card.appendChild(header);
      card.appendChild(body);
      grid.appendChild(card);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(heading);
    wrapper.appendChild(grid);
    container.appendChild(wrapper);

    // Interaction
    const cards = grid.querySelectorAll('.a55-accordion__card');
    const headers = grid.querySelectorAll('.a55-accordion__header');

    function toggleCard(index) {
      const card = cards[index];
      const isOpen = card.getAttribute('aria-expanded') === 'true';
      // Close all others (accordion behavior)
      cards.forEach((c, i) => {
        if (i !== index) {
          c.setAttribute('aria-expanded', 'false');
          headers[i].setAttribute('aria-expanded', 'false');
        }
      });
      // Toggle target
      const newState = !isOpen;
      card.setAttribute('aria-expanded', String(newState));
      headers[index].setAttribute('aria-expanded', String(newState));
    }

    headers.forEach((h, i) => {
      h.addEventListener('click', () => toggleCard(i));
    });

    // Keyboard navigation
    grid.addEventListener('keydown', (e) => {
      const focused = document.activeElement;
      if (!focused || !focused.classList.contains('a55-accordion__header')) return;
      const idx = Array.from(headers).indexOf(focused);
      if (idx === -1) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          headers[(idx + 1) % headers.length].focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          headers[(idx - 1 + headers.length) % headers.length].focus();
          break;
        case 'Home':
          e.preventDefault();
          headers[0].focus();
          break;
        case 'End':
          e.preventDefault();
          headers[headers.length - 1].focus();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          toggleCard(idx);
          break;
      }
    });
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderAccordion);
  } else {
    renderAccordion();
  }
})();
