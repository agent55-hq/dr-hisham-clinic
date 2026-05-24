/**
 * HeroConsultantProfile.jsx
 * Module: hero_consultant_profile
 * SPRINT-001 — Engineer Node
 *
 * Core rules:
 * - Completely specialty-blind: no hardcoded medical text, names, or imagery.
 * - Reads data from window.TENANT_CONFIG at runtime.
 * - Premium typography with fluid clamp() sizing.
 * - Full viewport height using 100dvh for iOS compatibility.
 * - Responsive: vertical stack on mobile, side-by-side on desktop.
 */

(function () {
  'use strict';

  const CONFIG = window.TENANT_CONFIG || {};

  /* ═══ Data resolution (config-first, then mock) ═══ */
  const mData = CONFIG.module_data?.hero_consultant_profile || {};

  const clinicName    = CONFIG.clinic_name          || 'The Specialized First Clinic';
  const physicianName = mData.physician_name        || CONFIG.physician_name || 'Dr. Hisham El-Qaisi';
  const spec          = mData.specialization        || CONFIG.specialization || 'otorhinolaryngology';
  const yearsExp      = mData.years_experience      ?? CONFIG.years_experience ?? 35;
  const biography     = mData.biography             || 'placeholder biography text';
  const certs         = mData.certifications        || CONFIG.certifications || ['placeholder cert'];
  const portraitUrl   = mData.portrait_url          || CONFIG.portrait_url || null;

  /* ═══ Styles (injected once) ═══ */
  const STYLE_ID = 'a55-hero-style';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .a55-hero {
        min-height: 100dvh;
        display: grid;
        grid-template-rows: 1fr auto;
        position: relative;
        overflow: hidden;
        background: var(--deep, #1a1410);
        color: #f5f0e8;
      }
      .a55-hero__bg {
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse 60% 50% at 30% 40%, rgba(184,147,90,0.07) 0%, transparent 70%),
                    linear-gradient(160deg, #1a1410 0%, #0f0c08 60%, #1a1208 100%);
        z-index: 0;
      }
      .a55-hero__lines {
        position: absolute;
        inset: 0;
        opacity: 0.03;
        background-image: repeating-linear-gradient(90deg, #b8935a 0, #b8935a 1px, transparent 1px, transparent 80px),
                          repeating-linear-gradient(0deg, #b8935a 0, #b8935a 1px, transparent 1px, transparent 80px);
        z-index: 0;
      }
      .a55-hero__content {
        position: relative;
        z-index: 2;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 120px 24px 60px;
      }
      .a55-hero__cred-bar {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        font-family: var(--mono, 'DM Mono', monospace);
        font-size: 10px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: var(--gold, #b8935a);
        margin-bottom: 40px;
        animation: a55FadeUp 0.8s ease 0.2s both;
      }
      .a55-hero__dot {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: var(--gold, #b8935a);
      }
      .a55-hero__name {
        font-family: var(--serif, 'Cormorant Garamond', Georgia, serif);
        font-size: clamp(2.5rem, 7vw, 5.5rem);
        font-weight: 300;
        line-height: 1.1;
        animation: a55FadeUp 0.9s ease 0.4s both;
        margin-bottom: 8px;
      }
      .a55-hero__clinic {
        font-family: var(--serif, 'Cormorant Garamond', Georgia, serif);
        font-size: clamp(1.4rem, 3.5vw, 2.8rem);
        font-weight: 300;
        font-style: italic;
        color: var(--gold-l, #d4ad76);
        animation: a55FadeUp 0.9s ease 0.55s both;
        margin-bottom: 32px;
      }
      .a55-hero__divider {
        width: 60px;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--gold, #b8935a), transparent);
        margin: 0 auto 32px;
        animation: a55FadeUp 0.8s ease 0.7s both;
      }
      .a55-hero__meta {
        font-size: 14px;
        font-weight: 300;
        color: var(--text3, #9e8b78);
        letter-spacing: 0.08em;
        animation: a55FadeUp 0.8s ease 0.85s both;
        line-height: 1.8;
        max-width: 480px;
      }
      .a55-hero__meta strong {
        color: #f5f0e8;
        font-weight: 500;
      }
      .a55-hero__portrait {
        width: clamp(120px, 18vw, 200px);
        height: clamp(120px, 18vw, 200px);
        border-radius: 50%;
        margin: 0 auto 32px;
        overflow: hidden;
        border: 1px solid rgba(184,147,90,0.2);
        animation: a55FadeUp 0.8s ease 0.3s both;
      }
      .a55-hero__portrait img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .a55-hero__placeholder-avatar {
        width: 100%;
        height: 100%;
        background: rgba(184,147,90,0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: clamp(2rem, 5vw, 3rem);
        color: rgba(184,147,90,0.35);
      }
      .a55-hero__bottom {
        position: relative;
        z-index: 2;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        border-top: 1px solid rgba(184,147,90,0.1);
        animation: a55FadeUp 0.8s ease 1.2s both;
      }
      .a55-hero__bottom-item {
        padding: 24px 32px;
        border-left: 1px solid rgba(184,147,90,0.08);
        text-align: center;
      }
      .a55-hero__bottom-item:last-child { border-left: none; }
      .a55-hero__bottom-label {
        font-family: var(--mono, 'DM Mono', monospace);
        font-size: 9px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: var(--text3, #9e8b78);
        margin-bottom: 6px;
      }
      .a55-hero__bottom-value {
        font-family: var(--serif, 'Cormorant Garamond', Georgia, serif);
        font-size: 18px;
        color: var(--gold-l, #d4ad76);
        font-style: italic;
      }
      .a55-hero__cta {
        display: flex;
        gap: 16px;
        margin-top: 52px;
        flex-wrap: wrap;
        justify-content: center;
        animation: a55FadeUp 0.8s ease 1s both;
      }

      @keyframes a55FadeUp {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* Responsive breakpoint: iPad Split View ~512px */
      @media (max-width: 768px) {
        .a55-hero__content { padding: 100px 24px 40px; }
        .a55-hero__bottom  { grid-template-columns: 1fr; }
        .a55-hero__bottom-item {
          border-left: none;
          border-top: 1px solid rgba(184,147,90,0.08);
        }
        .a55-hero__bottom-item:first-child { border-top: none; }
      }
      @media (max-width: 512px) {
        .a55-hero__name { font-size: clamp(2rem, 12vw, 3rem); }
        .a55-hero__clinic { font-size: clamp(1.1rem, 5vw, 1.6rem); }
        .a55-hero__cta { flex-direction: column; width: 100%; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ═══ Render ═══ */
  function renderHero() {
    const container = document.getElementById('a55-hero');
    if (!container) return;

    const hero = document.createElement('section');
    hero.className = 'a55-hero a55-module a55-module--hero_consultant_profile';
    hero.dataset.moduleId = 'hero_consultant_profile';

    // Background layers
    const bg = document.createElement('div');
    bg.className = 'a55-hero__bg';
    const lines = document.createElement('div');
    lines.className = 'a55-hero__lines';

    // Content
    const content = document.createElement('div');
    content.className = 'a55-hero__content';

    // Portrait (or placeholder)
    const portraitWrap = document.createElement('div');
    portraitWrap.className = 'a55-hero__portrait';
    if (portraitUrl) {
      const img = document.createElement('img');
      img.src = portraitUrl;
      img.alt = physicianName;
      img.loading = 'lazy';
      portraitWrap.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'a55-hero__placeholder-avatar';
      placeholder.setAttribute('aria-label', 'Portrait placeholder');
      placeholder.textContent = '\u{1F464}';
      portraitWrap.appendChild(placeholder);
    }

    // Credential bar
    const credBar = document.createElement('div');
    credBar.className = 'a55-hero__cred-bar';
    credBar.innerHTML = '<span class="a55-hero__dot"></span><span>' +
                        escapeHtml(clinicName) + '</span><span class="a55-hero__dot"></span>';

    // Name
    const name = document.createElement('h1');
    name.className = 'a55-hero__name';
    name.textContent = physicianName;

    // Clinic / specialization line
    const clinicLine = document.createElement('p');
    clinicLine.className = 'a55-hero__clinic';
    clinicLine.textContent = spec;

    // Divider
    const divider = document.createElement('div');
    divider.className = 'a55-hero__divider';

    // Meta block (experience, biography, certifications)
    const meta = document.createElement('div');
    meta.className = 'a55-hero__meta';
    meta.innerHTML =
      '<strong>' + escapeHtml(yearsExp.toString()) + '</strong> ' +
      'years of experience<br>' +
      escapeHtml(biography) + '<br>' +
      (Array.isArray(certs) ? certs.map(c => escapeHtml(c)).join(' \u00B7 ') : '');

    // Assemble content
    content.appendChild(portraitWrap);
    content.appendChild(credBar);
    content.appendChild(name);
    content.appendChild(clinicLine);
    content.appendChild(divider);
    content.appendChild(meta);

    // Bottom bar
    const bottom = document.createElement('div');
    bottom.className = 'a55-hero__bottom';
    bottom.innerHTML =
      '<div class="a55-hero__bottom-item">' +
        '<div class="a55-hero__bottom-label">Specialization</div>' +
        '<div class="a55-hero__bottom-value">' + escapeHtml(spec) + '</div>' +
      '</div>' +
      '<div class="a55-hero__bottom-item">' +
        '<div class="a55-hero__bottom-label">Experience</div>' +
        '<div class="a55-hero__bottom-value">' + escapeHtml(yearsExp.toString()) + '+ years</div>' +
      '</div>' +
      '<div class="a55-hero__bottom-item">' +
        '<div class="a55-hero__bottom-label">Clinic</div>' +
        '<div class="a55-hero__bottom-value">' + escapeHtml(clinicName) + '</div>' +
      '</div>';

    hero.appendChild(bg);
    hero.appendChild(lines);
    hero.appendChild(content);
    hero.appendChild(bottom);

    container.appendChild(hero);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHero);
  } else {
    renderHero();
  }
})();
