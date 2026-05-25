# INTERFACE SPECIFICATION — Agent55-OS SPRINT-001
## Dr. Hisham's Specialized First Clinic (hisham tenant)
**Date:** 2026-05-25 | **Branch:** main | **Derived from:** staging implementation

---

## Module: hero_consultant_profile
**Component:** HeroConsultantProfile.jsx  
**Layout Position:** hero (mounts to `#a55-hero`)  
**Compliance Class:** none

### Data Interface
| Field | Type | Required | Source |
|---|---|---|---|
| clinic_name | string | Yes | `config.clinic_name` |
| physician_name | string | Yes | `config.module_data.hero_consultant_profile.physician_name` or `config.physician_name` |
| specialization | string | Yes | `config.module_data.hero_consultant_profile.specialization` or `config.specialization` |
| years_experience | number | Yes | `config.module_data.hero_consultant_profile.years_experience` or `config.years_experience` |
| biography | string | Yes | `config.module_data.hero_consultant_profile.biography` or fallback |
| certifications | string[] | Yes | `config.module_data.hero_consultant_profile.certifications` or `config.certifications` |
| portrait_url | string \| null | No | `config.module_data.hero_consultant_profile.portrait_url` or `config.portrait_url` |

### CSS Requirements
- `min-height: 100dvh` (**NOT** `100vh` — iOS Safari toolbar collapse)
- Fluid typography via `clamp(min, preferred, max)`
- iPad Split View breakpoint at `max-width: 512px`
- Landscape mobile guard: `@media (max-height: 500px) and (orientation: landscape)`
- RTL: `border-inline-start` (**NOT** `border-left`)
- Safe area: `env(safe-area-inset-bottom)` for fixed elements

### Accessibility
- Semantic `<h1>` for physician name
- `aria-label` on portrait placeholder div
- All interactive elements keyboard-focusable
- `prefers-reduced-motion` respected

---

## Module: ent_clinical_accordion
**Component:** ClinicalAccordion.jsx (renamed from EntClinicalAccordion.jsx)  
**Layout Position:** body (mounts to `#a55-body`)  
**Compliance Class:** none  
**Specialty Note:** Fully specialty-agnostic. Yazeed's general surgery content can replace ENT content without code changes.

### Data Interface
| Field | Type | Required | Source |
|---|---|---|---|
| specializations | Array<{title, description}> | Yes | `config.module_data.ent_clinical_accordion.specializations` |

### CSS Requirements
- CSS Grid transition: `grid-template-rows: 0fr` → `1fr` (**NOT** `max-height` — avoids content clipping)
- Smooth expand/collapse with `overflow: hidden` on `.inner` wrapper
- `text-align: start` (**NOT** `text-align: left` — RTL safe)

### Keyboard Navigation
- `ArrowDown` / `ArrowUp` — navigate between accordion headers
- `Home` / `End` — jump to first/last header
- `Enter` / `Space` — toggle expand/collapse
- `Escape` — close all (optional)

### Responsive
- Desktop: `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`
- Mobile: single column stack

---

## Module: whatsapp_direct_routing
**Component:** WhatsAppDirectRouting_STUB.jsx  
**Layout Position:** body or cta  
**Compliance Class:** none

### Data Interface
| Field | Type | Required | Source |
|---|---|---|---|
| phone_number | string (E.164) | Yes | `config.module_data.whatsapp_direct_routing.phone_number` |
| prefilled_message | string | Yes | `config.module_data.whatsapp_direct_routing.prefilled_message` |

### Execution Rule
- `window.open()` must execute **synchronously** inside the click event handler
- Supabase insert (if active) must be a **fire-and-forget Promise** placed AFTER `window.open()`
- iOS Safari popup blocker will block `window.open()` if any `await` precedes it in the same execution frame

---

## Module: patient_intake_triage_v1
**Component:** PatientIntakeTriage_CRM_v1_STUB.jsx  
**Layout Position:** body  
**Compliance Class:** `sandbox-sprint001`

### Data Interface
| Field | Type | Required | Source |
|---|---|---|---|
| supabase_config | {url, anon_key} | Yes (for full impl) | `config.module_data.supabase` |
| whatsapp_config | {phone_number} | Yes | `config.module_data.whatsapp_direct_routing` |

### Compliance & Security
- **Consent checkbox MUST gate submit button** — button `disabled` until `consentChecked === true`
- **Zero client-side persistence:** No `localStorage`, `sessionStorage`, `document.cookie`, or URL query parameters containing PHI
- **Supabase write timing:** Fire-and-forget Promise executed AFTER `window.open()` for WhatsApp handoff
- **RLS required:** `patient_triage` table must have `anon_insert_only` policy with `tenant_id = 'hisham'` check

---

## Module: floating_ai_concierge_v1
**Component:** FloatingAIConcierge_v1_STUB.jsx  
**Layout Position:** fixed (appended to `<body>`, completely outside document flow)  
**Compliance Class:** none

### Data Interface
| Field | Type | Required | Source |
|---|---|---|---|
| greeting_message | string | Yes | `config.module_data.floating_ai_concierge_v1.greeting_message` |
| system_prompt_path | string | Yes | `config.module_data.floating_ai_concierge_v1.system_prompt_path` |
| avatar_url | string | No | `config.module_data.floating_ai_concierge_v1.avatar_url` |
| accent_color | string | No | `config.module_data.floating_ai_concierge_v1.accent_color` |

### CSS Requirements
- `position: fixed`
- `bottom: calc(24px + env(safe-area-inset-bottom))` — iPhone notch safe
- `inset-inline-end: 24px` (**NOT** `right: 24px` — RTL safe)
- `z-index: 50`
- Tray width: `clamp(280px, 90vw, 360px)`
- Tray height: `clamp(320px, 50vh, 480px)`
- Close button: minimum `44px × 44px` touch target (WCAG 2.5.5)

---

## Global Layout Engine Requirements

### Config-Driven Rendering
The layout engine (`layoutEngine.js`) must:
1. Read `window.TENANT_CONFIG` at runtime
2. Iterate `config.active_modules` array in order
3. Map each module ID to its component via `MODULE_REGISTRY`
4. Mount to correct DOM container based on `layoutPosition`
5. Append `fixed` position modules directly to `<body>`

### iOS Safari Specific
- `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">` — mandatory for safe-area support
- Use `100dvh` (dynamic viewport height) not `100vh` — accounts for toolbar collapse
- Use `env(safe-area-inset-bottom)` and `env(safe-area-inset-top)` for notch-aware padding

### RTL (Arabic/English Toggle)
- All directional CSS must use logical properties:
  - `inset-inline-start` / `inset-inline-end` (not `left` / `right`)
  - `border-inline-start` / `border-inline-end` (not `border-left` / `border-right`)
  - `margin-inline-start` / `margin-inline-end`
  - `padding-inline-start` / `padding-inline-end`
  - `text-align: start` (not `text-align: left`)

### Accessibility
- All interactive elements must have `tabindex="0"` or be natively focusable
- `aria-expanded` on accordion toggles
- `aria-hidden` on closed trays/dialogs
- `aria-label` on icon-only buttons
- `role` attributes where semantic HTML is insufficient
- `prefers-reduced-motion: reduce` must disable all CSS transitions
