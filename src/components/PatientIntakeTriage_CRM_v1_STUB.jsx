/**
 * PatientIntakeTriage_CRM_v1_STUB.jsx
 * Module: patient_intake_triage_v1
 * SPRINT-001 — Engineer Node (STUB)
 *
 * Scope boundary:
 * - DO NOT initialize Supabase client — credentials pending from Owner.
 * - Renders a form skeleton with disabled submit and disabled consent checkbox.
 * - Consent checkbox must gate submit button (DOM structure supports it; logic stubbed).
 */

(function () {
  'use strict';

  console.warn(
    '[A55-Module] patient_intake_triage_v1: Module not yet implemented — placeholder rendered. ' +
    'Secure triage system activation pending.'
  );

  /* ═══ Styles (injected once) ═══ */
  const STYLE_ID = 'a55-triage-stub-style';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .a55-triage-stub {
        padding: 60px 24px;
        max-width: 600px;
        margin: 0 auto;
      }
      .a55-triage-stub__heading {
        font-family: var(--serif, 'Cormorant Garamond', Georgia, serif);
        font-size: clamp(1.6rem, 3vw, 2.2rem);
        font-weight: 300;
        color: var(--deep, #1a1410);
        margin-bottom: 8px;
      }
      .a55-triage-stub__notice {
        font-family: var(--mono, 'DM Mono', monospace);
        font-size: 11px;
        color: var(--text3, #9e8b78);
        letter-spacing: 0.05em;
        margin-bottom: 32px;
        padding: 12px 16px;
        border: 1px dashed var(--border, rgba(184,147,90,0.2));
        border-radius: 2px;
      }
      .a55-triage-stub__field {
        margin-bottom: 20px;
      }
      .a55-triage-stub__field label {
        display: block;
        font-family: var(--mono, 'DM Mono', monospace);
        font-size: 9px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--text3, #9e8b78);
        margin-bottom: 6px;
      }
      .a55-triage-stub__field input,
      .a55-triage-stub__field textarea {
        width: 100%;
        padding: 12px 14px;
        border: 1px solid var(--border, rgba(184,147,90,0.2));
        border-radius: 2px;
        background: #fff;
        font-size: 14px;
        color: var(--text, #2c2218);
        font-family: inherit;
        opacity: 0.6;
      }
      .a55-triage-stub__field textarea {
        min-height: 80px;
        resize: vertical;
      }
      .a55-triage-stub__field input:disabled,
      .a55-triage-stub__field textarea:disabled {
        cursor: not-allowed;
      }
      .a55-triage-stub__consent {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        margin: 24px 0;
        font-size: 13px;
        color: var(--text2, #6b5a47);
      }
      .a55-triage-stub__consent input[type="checkbox"] {
        margin-top: 2px;
        flex-shrink: 0;
      }
      .a55-triage-stub__submit {
        display: block;
        width: 100%;
        padding: 14px 24px;
        background: var(--gold, #b8935a);
        color: #fff;
        border: none;
        border-radius: 3px;
        font-size: 14px;
        font-weight: 500;
        cursor: not-allowed;
        opacity: 0.4;
        transition: opacity 0.2s;
      }
      .a55-triage-stub__submit:not(:disabled) {
        opacity: 1;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  }

  function renderStub() {
    const container = document.getElementById('a55-body') || document.getElementById('a55-cta');
    if (!container) return;

    const wrapper = document.createElement('section');
    wrapper.className = 'a55-triage-stub a55-module a55-module--patient_intake_triage_v1';
    wrapper.dataset.moduleId = 'patient_intake_triage_v1';

    const heading = document.createElement('h2');
    heading.className = 'a55-triage-stub__heading';
    heading.textContent = 'Patient Intake & Triage';

    const notice = document.createElement('p');
    notice.className = 'a55-triage-stub__notice';
    notice.textContent = 'Coming soon — secure triage system activation pending';

    // Fields
    const fields = [
      { id: 'a55-triage-name',  label: 'Full Name',  type: 'text',     placeholder: 'Enter full name' },
      { id: 'a55-triage-phone', label: 'Phone',      type: 'tel',      placeholder: '+962 ...' },
      { id: 'a55-triage-age',   label: 'Age',        type: 'number',   placeholder: 'Age' },
    ];

    fields.forEach(f => {
      const fieldDiv = document.createElement('div');
      fieldDiv.className = 'a55-triage-stub__field';
      const lbl = document.createElement('label');
      lbl.htmlFor = f.id;
      lbl.textContent = f.label;
      const input = document.createElement('input');
      input.id = f.id;
      input.type = f.type;
      input.placeholder = f.placeholder;
      input.disabled = true;
      fieldDiv.appendChild(lbl);
      fieldDiv.appendChild(input);
      wrapper.appendChild(fieldDiv);
    });

    // Complaint textarea
    const complaintDiv = document.createElement('div');
    complaintDiv.className = 'a55-triage-stub__field';
    const complaintLbl = document.createElement('label');
    complaintLbl.htmlFor = 'a55-triage-complaint';
    complaintLbl.textContent = 'Chief Complaint';
    const textarea = document.createElement('textarea');
    textarea.id = 'a55-triage-complaint';
    textarea.placeholder = 'Describe your symptoms or reason for visit...';
    textarea.disabled = true;
    complaintDiv.appendChild(complaintLbl);
    complaintDiv.appendChild(textarea);
    wrapper.appendChild(complaintDiv);

    // Consent checkbox (disabled stub, but DOM structure gates submit)
    const consentDiv = document.createElement('div');
    consentDiv.className = 'a55-triage-stub__consent';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'a55-triage-consent';
    checkbox.disabled = true; // stub
    const consentLabel = document.createElement('label');
    consentLabel.htmlFor = 'a55-triage-consent';
    consentLabel.textContent = 'I consent to the privacy policy and agree to the terms of data processing for clinical triage purposes.';
    consentDiv.appendChild(checkbox);
    consentDiv.appendChild(consentLabel);
    wrapper.appendChild(consentDiv);

    // Submit button
    const submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'a55-triage-stub__submit';
    submit.textContent = 'Submit Intake';
    submit.disabled = true;
    submit.id = 'a55-triage-submit';
    wrapper.appendChild(submit);

    container.appendChild(wrapper);

    // Stub: wire consent → submit gating (ready for real logic later)
    checkbox.addEventListener('change', () => {
      submit.disabled = !checkbox.checked;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderStub);
  } else {
    renderStub();
  }
})();
