// moduleRegistry.js
// Canonical module registry for Agent55-OS SPRINT-001
// Derived from actual implementation on staging branch
// Last updated: 2026-05-25

const MODULE_REGISTRY = {
  'hero_consultant_profile': {
    component: 'HeroConsultantProfile',
    requiredData: ['clinic_name', 'physician_name', 'specialization', 'years_experience', 'biography', 'certifications', 'portrait_url'],
    optionalData: ['clinic_location', 'clinic_hours'],
    layoutPosition: 'hero',
    complianceClass: null,
    zIndex: null,
    filePath: 'src/components/HeroConsultantProfile.jsx',
    cssRequirements: ['100dvh', 'clamp()', 'border-inline-start', 'landscape-guard']
  },
  'ent_clinical_accordion': {
    component: 'ClinicalAccordion',
    requiredData: ['specializations'],
    optionalData: ['procedures', 'technologies'],
    layoutPosition: 'body',
    complianceClass: null,
    zIndex: null,
    filePath: 'src/components/ClinicalAccordion.jsx',
    note: 'Specialty-agnostic: yazeed can swap content for general surgery',
    cssRequirements: ['grid-template-rows', 'overflow-hidden-inner', 'text-align-start', 'keyboard-nav']
  },
  'whatsapp_direct_routing': {
    component: 'WhatsAppDirectRouting',
    requiredData: ['phone_number', 'prefilled_message'],
    layoutPosition: 'cta',
    complianceClass: null,
    zIndex: null,
    filePath: 'src/components/WhatsAppDirectRouting_STUB.jsx',
    notes: 'Client-side only. window.open() must execute synchronously in click frame.'
  },
  'patient_intake_triage_v1': {
    component: 'PatientIntakeTriage_CRM_v1',
    requiredData: ['supabase_config', 'whatsapp_config'],
    layoutPosition: 'body',
    complianceClass: 'sandbox-sprint001',
    zIndex: null,
    filePath: 'src/components/PatientIntakeTriage_CRM_v1_STUB.jsx',
    notes: 'Consent checkbox MUST gate submit. No localStorage/sessionStorage/cookies. Supabase write is fire-and-forget Promise AFTER window.open().'
  },
  'floating_ai_concierge_v1': {
    component: 'FloatingAIConcierge_v1',
    requiredData: ['greeting_message', 'system_prompt_path'],
    optionalData: ['avatar_url', 'accent_color'],
    layoutPosition: 'fixed',
    complianceClass: null,
    zIndex: 50,
    filePath: 'src/components/FloatingAIConcierge_v1_STUB.jsx',
    cssRequirements: ['position-fixed', 'env(safe-area-inset-bottom)', 'inset-inline-end', '44px-touch-target']
  }
};

module.exports = MODULE_REGISTRY;
