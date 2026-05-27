/**
 * Agent55-OS — OnboardingPortal v1.0
 * Minimal mount wrapper for the OnboardingChatEngine.
 * Creates container div and initializes the chat engine.
 *
 * // TODO: wire tenants/hisham/onboarding-config.json into engine via window.ONBOARDING_TENANT_ID
 */

(function () {
  'use strict';

  function mount(parentSelector) {
    const target = parentSelector
      ? document.querySelector(parentSelector)
      : document.body;

    if (!target) {
      console.error('[OnboardingPortal] Mount target not found:', parentSelector);
      return;
    }

    // Create dedicated container
    const container = document.createElement('div');
    container.id = 'onboarding-container';
    target.appendChild(container);

    // Initialize chat engine if available
    if (typeof window.OnboardingChatEngine !== 'undefined' && window.OnboardingChatEngine.init) {
      window.OnboardingChatEngine.init('#onboarding-container');
    } else {
      console.error('[OnboardingPortal] OnboardingChatEngine not loaded. Ensure src/components/OnboardingChatEngine.js loads first.');
    }
  }

  window.OnboardingPortal = { mount };
})();
