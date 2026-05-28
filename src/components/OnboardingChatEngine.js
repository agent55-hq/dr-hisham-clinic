(function (global) {
  'use strict';

  var DAY_KEYS = [
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' }
  ];

  function normalizeText(value) {
    return String(value || '').trim();
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  function createEl(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (typeof text === 'string') el.textContent = text;
    return el;
  }

  function safeJsonParse(text, fallback) {
    try {
      return JSON.parse(text);
    } catch (err) {
      return fallback;
    }
  }

  function stripAllTags(text) {
    return String(text || '')
      .split('[SHOW_HOURS_WIDGET]').join('')
      .split('[EXPORT_READY]').join('')
      .split('[/EXPORT_READY]').join('')
      .trim();
  }

  function extractExportPayload(raw) {
    var text = String(raw || '');
    var start = text.indexOf('[EXPORT_READY]');
    var end = text.indexOf('[/EXPORT_READY]');
    if (start === -1 || end === -1 || end <= start) return null;

    var payload = text.slice(start + '[EXPORT_READY]'.length, end).trim();
    if (!payload) return null;

    try {
      return JSON.parse(payload);
    } catch (err) {
      return null;
    }
  }

  function formatDayRange(dayLabel, entry) {
    if (!entry || entry.open === false) {
      return dayLabel + ': Closed';
    }
    return dayLabel + ': ' + (entry.from || '--:--') + '–' + (entry.to || '--:--');
  }

  function buildHoursSummary(hours) {
    return DAY_KEYS.map(function (day) {
      return formatDayRange(day.label, hours && hours[day.key]);
    }).join(', ');
  }

  function buildHoursMarkdown(hours) {
    return DAY_KEYS.map(function (day) {
      return '- ' + formatDayRange(day.label, hours && hours[day.key]);
    }).join('\n');
  }

  function buildServicesMarkdown(services) {
    var sections = [
      { key: 'consultations', title: 'Consultations' },
      { key: 'diagnostics', title: 'Diagnostic Services' },
      { key: 'procedures', title: 'Procedures' },
      { key: 'surgeries', title: 'Surgeries and Operations' },
      { key: 'follow_up', title: 'Follow-up and Post-operative Care' },
      { key: 'other', title: 'Other Services' }
    ];

    var out = [];
    sections.forEach(function (section) {
      var items = (services && services[section.key]) || [];
      out.push('## ' + section.title);
      if (!items.length) {
        out.push('- None listed');
      } else {
        items.forEach(function (item) {
          out.push('- ' + item);
        });
      }
      out.push('');
    });

    return out.join('\n').trim();
  }

  function downloadBlob(filename, content, mimeType) {
    var blob = new Blob([content], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  class OnboardingChatEngineInstance {
    constructor(root) {
      this.root = root;
      this.state = {
        selectedLanguage: null,
        rtl: false,
        messages: [],
        exportData: null,
        waitingForHours: false,
        isBusy: false
      };

      this.dom = {
        shell: null,
        languageScreen: null,
        transcript: null,
        composer: null,
        review: null,
        composerInput: null,
        composerSend: null,
        typingIndicator: null,
        hoursWidget: null
      };

      this.boundKeyHandler = this.onGlobalKeyDown.bind(this);
      this.injectStyles();
    }

    mount() {
      this.renderShell();
      this.renderLanguageSelection();
      document.addEventListener('keydown', this.boundKeyHandler);
    }

    destroy() {
      document.removeEventListener('keydown', this.boundKeyHandler);
      if (this.root) this.root.innerHTML = '';
    }

    injectStyles() {
      if (document.getElementById('a55-onboarding-engine-styles')) return;

      var style = document.createElement('style');
      style.id = 'a55-onboarding-engine-styles';
      style.textContent = `
        .a55-onboarding-shell{
          display:flex;
          flex-direction:column;
          min-height:100%;
          background:#faf8f4;
          color:#2c2218;
          font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
        }
        .a55-onboarding-language{
          min-height:100%;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          gap:18px;
          padding:32px;
          text-align:center;
        }
        .a55-onboarding-language__title{
          font-size:clamp(1.4rem,3vw,2rem);
          font-weight:800;
          line-height:1.2;
          margin:0;
        }
        .a55-onboarding-language__subtitle{
          font-size:1rem;
          opacity:.72;
          margin:0;
        }
        .a55-onboarding-language__choices{
          display:flex;
          gap:12px;
          flex-wrap:wrap;
          justify-content:center;
        }
        .a55-onboarding-language__btn{
          min-width:160px;
          min-height:56px;
          padding:14px 20px;
          border:1px solid rgba(184,147,90,.28);
          border-radius:14px;
          background:#fff;
          cursor:pointer;
          font-size:1rem;
          font-weight:800;
        }
        .a55-onboarding-chat{
          display:flex;
          flex-direction:column;
          gap:14px;
          padding:20px;
          flex:1;
          overflow:auto;
        }
        .a55-onboarding-message{
          max-width:min(92%,760px);
          padding:14px 16px;
          border-radius:16px;
          line-height:1.6;
          white-space:pre-wrap;
          word-break:break-word;
        }
        .a55-onboarding-message--assistant{
          align-self:flex-start;
          background:#fff;
          border:1px solid rgba(184,147,90,.12);
        }
        .a55-onboarding-message--user{
          align-self:flex-end;
          background:#ece8e0;
        }
        .a55-hours-widget{
          display:flex;
          flex-direction:column;
          gap:12px;
        }
        .a55-hours-grid{
          display:grid;
          grid-template-columns:1.1fr auto 1fr 1fr;
          gap:10px;
          align-items:center;
        }
        .a55-hours-grid__day{
          font-weight:800;
        }
        .a55-hours-grid__toggle{
          display:flex;
          align-items:center;
          gap:8px;
          font-size:.95rem;
        }
        .a55-hours-input{
          width:100%;
          min-height:40px;
          padding:8px 10px;
          border:1px solid rgba(184,147,90,.2);
          border-radius:10px;
          background:#fff;
        }
        .a55-hours-actions{
          display:flex;
          gap:10px;
          flex-wrap:wrap;
        }
        .a55-hours-button{
          min-height:44px;
          padding:10px 16px;
          border:1px solid rgba(184,147,90,.28);
          border-radius:12px;
          background:#1a1410;
          color:#b8935a;
          cursor:pointer;
          font-weight:800;
        }
        .a55-typing-indicator{
          display:flex;
          align-items:center;
          gap:6px;
          padding:10px 14px;
          align-self:flex-start;
          background:#fff;
          border:1px solid rgba(184,147,90,.12);
          border-radius:16px;
          min-height:48px;
        }
        .a55-typing-indicator__dot{
          width:7px;
          height:7px;
          border-radius:999px;
          background:#9e8b78;
          animation:a55TypingDot 1.2s infinite ease-in-out both;
        }
        .a55-typing-indicator__dot:nth-child(1){ animation-delay:0s; }
        .a55-typing-indicator__dot:nth-child(2){ animation-delay:.18s; }
        .a55-typing-indicator__dot:nth-child(3){ animation-delay:.36s; }
        @keyframes a55TypingDot{
          0%,80%,100%{ transform:scale(.65); opacity:.45; }
          40%{ transform:scale(1); opacity:1; }
        }
        .a55-onboarding-composer{
          display:flex;
          gap:10px;
          padding:16px 20px 20px;
          border-top:1px solid rgba(184,147,90,.12);
          background:#fff;
        }
        .a55-onboarding-composer__input{
          flex:1;
          min-height:52px;
          max-height:140px;
          resize:vertical;
          padding:12px 14px;
          border:1px solid rgba(184,147,90,.22);
          border-radius:14px;
          background:#fff;
          font:inherit;
          line-height:1.5;
        }
        .a55-onboarding-composer__send{
          min-width:110px;
          min-height:52px;
          padding:12px 16px;
          border:1px solid rgba(184,147,90,.28);
          border-radius:14px;
          background:#1a1410;
          color:#b8935a;
          cursor:pointer;
          font-weight:800;
        }
        .a55-review{
          display:flex;
          flex-direction:column;
          gap:14px;
          padding:20px;
          border-top:1px solid rgba(184,147,90,.12);
          background:#fff;
        }
        .a55-review__title{
          margin:0;
          font-size:1.2rem;
          font-weight:800;
        }
        .a55-review__preview{
          white-space:pre-wrap;
          word-break:break-word;
          font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
          font-size:12px;
          line-height:1.6;
          margin:0;
          background:#faf8f4;
          border:1px solid rgba(184,147,90,.12);
          border-radius:14px;
          padding:16px;
          overflow:auto;
        }
        .a55-review__actions{
          display:flex;
          gap:10px;
          flex-wrap:wrap;
        }
        .a55-review__button{
          min-height:44px;
          padding:10px 16px;
          border:1px solid rgba(184,147,90,.28);
          border-radius:12px;
          background:#1a1410;
          color:#b8935a;
          cursor:pointer;
          font-weight:800;
        }
      `;
      document.head.appendChild(style);
    }

    renderShell() {
      this.root.innerHTML = '';
      this.dom.shell = createEl('div', 'a55-onboarding-shell');
      this.dom.languageScreen = createEl('section', 'a55-onboarding-language');
      this.dom.transcript = createEl('section', 'a55-onboarding-chat');
      this.dom.composer = createEl('div', 'a55-onboarding-composer');
      this.dom.review = createEl('section', 'a55-review');

      this.dom.transcript.style.display = 'none';
      this.dom.composer.style.display = 'none';
      this.dom.review.style.display = 'none';

      this.dom.shell.appendChild(this.dom.languageScreen);
      this.dom.shell.appendChild(this.dom.transcript);
      this.dom.shell.appendChild(this.dom.composer);
      this.dom.shell.appendChild(this.dom.review);
      this.root.appendChild(this.dom.shell);
    }

    renderLanguageSelection() {
      var title = createEl('h1', 'a55-onboarding-language__title', 'اختر لغتك / Choose your language');
      var subtitle = createEl('p', 'a55-onboarding-language__subtitle', 'Pick the language for this session before we begin.');
      var choices = createEl('div', 'a55-onboarding-language__choices');

      var arabic = createEl('button', 'a55-onboarding-language__btn', 'العربية');
      var english = createEl('button', 'a55-onboarding-language__btn', 'English');
      arabic.type = 'button';
      english.type = 'button';

      var self = this;
      arabic.addEventListener('click', function () {
        self.chooseLanguage('ar');
      });
      english.addEventListener('click', function () {
        self.chooseLanguage('en');
      });

      choices.appendChild(arabic);
      choices.appendChild(english);

      this.dom.languageScreen.innerHTML = '';
      this.dom.languageScreen.appendChild(title);
      this.dom.languageScreen.appendChild(subtitle);
      this.dom.languageScreen.appendChild(choices);
    }

    chooseLanguage(lang) {
      this.state.selectedLanguage = lang === 'ar' ? 'ar' : 'en';
      this.state.rtl = this.state.selectedLanguage === 'ar';
      this.applyDirection();

      this.dom.languageScreen.style.display = 'none';
      this.dom.transcript.style.display = 'flex';
      this.dom.composer.style.display = 'flex';
      this.dom.review.style.display = 'none';

      this.renderComposer();
      this.state.messages = [];
      this.startConversation();
      this.focusComposer();
    }

    applyDirection() {
      var isArabic = this.state.selectedLanguage === 'ar';
      this.root.setAttribute('dir', isArabic ? 'rtl' : 'ltr');
      this.root.style.direction = isArabic ? 'rtl' : 'ltr';
      this.root.style.textAlign = isArabic ? 'right' : 'left';
      this.dom.shell.style.direction = isArabic ? 'rtl' : 'ltr';
      this.dom.transcript.style.direction = isArabic ? 'rtl' : 'ltr';
      this.dom.composer.style.direction = isArabic ? 'rtl' : 'ltr';
      this.dom.review.style.direction = isArabic ? 'rtl' : 'ltr';
    }

    startConversation() {
      if (!this.state.selectedLanguage) return;
      this.enqueueHiddenUserMessage('LANGUAGE:' + this.state.selectedLanguage);
      this.sendToProxy();
    }

    enqueueHiddenUserMessage(content) {
      this.state.messages.push({
        role: 'user',
        content: content,
        silent: true
      });
    }

    enqueueVisibleUserMessage(content) {
      this.state.messages.push({
        role: 'user',
        content: content
      });
      this.renderBubble('user', content);
    }

    enqueueAssistantMessage(content) {
      this.state.messages.push({
        role: 'assistant',
        content: content
      });
      this.renderBubble('assistant', content);
    }

    renderBubble(role, content) {
      var bubble = createEl(
        'div',
        'a55-onboarding-message a55-onboarding-message--' + role,
        content
      );

      bubble.style.alignSelf = role === 'user'
        ? 'flex-end'
        : 'flex-start';

      bubble.style.direction = this.state.rtl ? 'rtl' : 'ltr';
      bubble.style.textAlign = this.state.rtl ? 'right' : 'left';

      this.dom.transcript.appendChild(bubble);
      this.scrollToBottom();
      return bubble;
    }

    renderComposer() {
      this.dom.composer.innerHTML = '';

      var input = document.createElement('textarea');
      input.className = 'a55-onboarding-composer__input';
      input.setAttribute('aria-label', 'Message');
      input.dir = this.state.rtl ? 'rtl' : 'ltr';
      input.placeholder = this.state.selectedLanguage === 'ar'
        ? 'اكتب رسالتك هنا...'
        : 'Type your message here...';

      var send = createEl(
        'button',
        'a55-onboarding-composer__send',
        this.state.selectedLanguage === 'ar' ? 'إرسال' : 'Send'
      );
      send.type = 'button';

      var self = this;

      function submitCurrentMessage() {
        var value = normalizeText(input.value);
        if (!value || self.state.isBusy) return;
        input.value = '';
        self.enqueueVisibleUserMessage(value);
        self.sendToProxy();
      }

      send.addEventListener('click', submitCurrentMessage);
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          submitCurrentMessage();
        }
      });

      this.dom.composerInput = input;
      this.dom.composerSend = send;

      this.dom.composer.appendChild(input);
      this.dom.composer.appendChild(send);
    }

    focusComposer() {
      if (this.dom.composerInput) {
        setTimeout(function () {
          try {
            this.dom.composerInput.focus();
          } catch (err) {}
        }.bind(this), 0);
      }
    }

    showTypingIndicator() {
      if (this.dom.typingIndicator) return;

      var indicator = createEl('div', 'a55-typing-indicator');
      indicator.id = 'a55-typing-indicator';
      indicator.setAttribute('aria-live', 'polite');
      indicator.innerHTML = [
        '<span class="a55-typing-indicator__dot"></span>',
        '<span class="a55-typing-indicator__dot"></span>',
        '<span class="a55-typing-indicator__dot"></span>'
      ].join('');

      this.dom.typingIndicator = indicator;
      this.dom.transcript.appendChild(indicator);
      this.scrollToBottom();
    }

    hideTypingIndicator() {
      if (this.dom.typingIndicator && this.dom.typingIndicator.parentNode) {
        this.dom.typingIndicator.parentNode.removeChild(this.dom.typingIndicator);
      }
      this.dom.typingIndicator = null;
    }

    renderHoursWidget() {
      if (this.dom.hoursWidget) return;

      var widget = createEl('div', 'a55-onboarding-message a55-onboarding-message--assistant a55-hours-widget');
      widget.setAttribute('data-widget', 'hours');
      widget.style.alignSelf = 'flex-start';
      widget.style.direction = this.state.rtl ? 'rtl' : 'ltr';
      widget.style.textAlign = this.state.rtl ? 'right' : 'left';

      var title = createEl('div', null, this.state.selectedLanguage === 'ar' ? 'ساعات العمل' : 'Working hours');
      title.style.fontWeight = '800';

      var grid = createEl('div', 'a55-hours-grid');
      var rowState = {};
      var self = this;

      DAY_KEYS.forEach(function (day) {
        rowState[day.key] = { open: true, from: '10:30', to: '14:30' };

        var dayLabel = createEl('div', 'a55-hours-grid__day', day.label);

        var toggleWrap = createEl('label', 'a55-hours-grid__toggle');
        var toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.checked = true;

        var toggleText = createEl('span', null, self.state.selectedLanguage === 'ar' ? 'مفتوح' : 'Open');

        var fromInput = document.createElement('input');
        fromInput.type = 'time';
        fromInput.className = 'a55-hours-input';
        fromInput.value = '10:30';

        var toInput = document.createElement('input');
        toInput.type = 'time';
        toInput.className = 'a55-hours-input';
        toInput.value = '14:30';

        toggle.addEventListener('change', function () {
          rowState[day.key].open = toggle.checked;
          fromInput.disabled = !toggle.checked;
          toInput.disabled = !toggle.checked;
          toggleText.textContent = toggle.checked
            ? (self.state.selectedLanguage === 'ar' ? 'مفتوح' : 'Open')
            : (self.state.selectedLanguage === 'ar' ? 'مغلق' : 'Closed');
        });

        fromInput.addEventListener('change', function () {
          rowState[day.key].from = fromInput.value;
        });

        toInput.addEventListener('change', function () {
          rowState[day.key].to = toInput.value;
        });

        toggleWrap.appendChild(toggle);
        toggleWrap.appendChild(toggleText);

        grid.appendChild(dayLabel);
        grid.appendChild(toggleWrap);
        grid.appendChild(fromInput);
        grid.appendChild(toInput);
      });

      var actions = createEl('div', 'a55-hours-actions');
      var copyAll = createEl(
        'button',
        'a55-hours-button',
        this.state.selectedLanguage === 'ar' ? 'نسخ إلى كل الأيام المفتوحة' : 'Copy to all open days'
      );
      var confirm = createEl(
        'button',
        'a55-hours-button',
        this.state.selectedLanguage === 'ar' ? 'تأكيد الساعات' : 'Confirm hours'
      );
      copyAll.type = 'button';
      confirm.type = 'button';

      copyAll.addEventListener('click', function () {
        var firstOpen = DAY_KEYS.map(function (day) {
          return rowState[day.key];
        }).find(function (entry) {
          return entry.open;
        });

        if (!firstOpen) return;

        DAY_KEYS.forEach(function (day) {
          if (rowState[day.key].open) {
            rowState[day.key].from = firstOpen.from;
            rowState[day.key].to = firstOpen.to;
          }
        });

        self.renderBubble(
          'assistant',
          self.state.selectedLanguage === 'ar'
            ? 'تم تطبيق نفس الوقت على كل الأيام المفتوحة.'
            : 'Applied the same hours to all open days.'
        );
      });

      confirm.addEventListener('click', function () {
        var payload = {};
        DAY_KEYS.forEach(function (day) {
          payload[day.key] = rowState[day.key].open
            ? {
                open: true,
                from: rowState[day.key].from,
                to: rowState[day.key].to
              }
            : { open: false };
        });

        self.state.waitingForHours = false;
        self.state.messages.push({
          role: 'user',
          content: 'HOURS_DATA:' + JSON.stringify(payload),
          silent: true
        });

        self.renderBubble(
          'assistant',
          self.state.selectedLanguage === 'ar'
            ? 'تم حفظ ساعات العمل: ' + self.formatHoursSummary(payload)
            : 'Hours saved: ' + self.formatHoursSummary(payload)
        );

        self.removeHoursWidget();
        self.sendToProxy();
      });

      actions.appendChild(copyAll);
      actions.appendChild(confirm);

      widget.appendChild(title);
      widget.appendChild(grid);
      widget.appendChild(actions);

      this.dom.hoursWidget = widget;
      this.dom.transcript.appendChild(widget);
      this.state.waitingForHours = true;
      this.scrollToBottom();
    }

    removeHoursWidget() {
      if (this.dom.hoursWidget && this.dom.hoursWidget.parentNode) {
        this.dom.hoursWidget.parentNode.removeChild(this.dom.hoursWidget);
      }
      this.dom.hoursWidget = null;
    }

    formatHoursSummary(payload) {
      return DAY_KEYS.map(function (day) {
        return formatDayRange(day.label, payload && payload[day.key]);
      }).join(', ');
    }

    async parseProxyResponse(res) {
      if (!res) return { reply: '' };

      var data = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        try {
          var raw = await res.text();
          data = safeJsonParse(raw, { reply: raw });
        } catch (textErr) {
          data = { reply: '' };
        }
      }

      if (typeof data === 'string') {
        return { reply: data };
      }

      return data || {};
    }

    async sendToProxy(retryCount) {
      if (typeof retryCount !== 'number') retryCount = 0;
      if (this.state.isBusy && retryCount === 0) return;
      this.state.isBusy = true;
      this.showTypingIndicator();
      if (this.dom.composerSend) this.dom.composerSend.disabled = true;
      if (this.dom.composerInput) this.dom.composerInput.disabled = true;
      var retrying = false;
      try {
        var response = await fetch('/api/onboarding-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: this.state.messages.map(function(m) {
              return { role: m.role, content: m.content };
            }),
            language: this.state.selectedLanguage
          })
        });
        var data = await this.parseProxyResponse(response);
        var text = (data && (data.reply || data.error || data.message)) || '';
        if (!text && response && !response.ok) {
          text = this.state.selectedLanguage === 'ar'
            ? 'حدث خطأ أثناء معالجة الطلب.'
            : 'There was an error processing the request.';
        }
        this.handleAssistantResponse(text);
      } catch (err) {
        if (retryCount < 1) {
          retrying = true;
          await new Promise(function(resolve) { setTimeout(resolve, 1200); });
        } else {
          this.enqueueAssistantMessage(
            this.state.selectedLanguage === 'ar'
              ? 'حدث خطأ أثناء إرسال الرسالة. حاول مرة أخرى.'
              : 'There was an error sending the message. Please try again.'
          );
        }
      } finally {
        if (!retrying) {
          this.hideTypingIndicator();
          this.state.isBusy = false;
          if (this.dom.composerSend) this.dom.composerSend.disabled = false;
          if (this.dom.composerInput) this.dom.composerInput.disabled = false;
          this.focusComposer();
        }
      }
      if (retrying) {
        this.hideTypingIndicator();
        this.state.isBusy = false;
        return this.sendToProxy(retryCount + 1);
      }
    }

    handleAssistantResponse(rawText) {
      var text = String(rawText || '');
      var exportData = extractExportPayload(text);
      var shouldShowHours = text.indexOf('[SHOW_HOURS_WIDGET]') !== -1;
      var displayText = stripAllTags(text).trim();

      if (displayText) {
        this.enqueueAssistantMessage(displayText);
      }

      if (shouldShowHours) {
        this.renderHoursWidget();
      }

      if (exportData) {
        this.transitionToReview(exportData);
      }
    }

    transitionToReview(data) {
      this.state.exportData = deepClone(data);

      this.dom.transcript.style.display = 'none';
      this.dom.composer.style.display = 'none';
      this.dom.review.style.display = 'flex';
      this.renderReview();
    }

    renderReview() {
      this.dom.review.innerHTML = '';

      var title = createEl(
        'h2',
        'a55-review__title',
        this.state.selectedLanguage === 'ar' ? 'مراجعة التصدير' : 'Review export'
      );

      var preview = createEl('pre', 'a55-review__preview', this.generateMarkdownPRD(this.state.exportData));

      var actions = createEl('div', 'a55-review__actions');

      var jsonButton = createEl(
        'button',
        'a55-review__button',
        this.state.selectedLanguage === 'ar' ? 'تنزيل JSON' : 'Download JSON'
      );
      var markdownButton = createEl(
        'button',
        'a55-review__button',
        this.state.selectedLanguage === 'ar' ? 'تنزيل Markdown PRD' : 'Download Markdown PRD'
      );

      var self = this;

      jsonButton.type = 'button';
      markdownButton.type = 'button';

      jsonButton.addEventListener('click', function () {
        self.downloadExport('json');
      });

      markdownButton.addEventListener('click', function () {
        self.downloadExport('markdown');
      });

      actions.appendChild(jsonButton);
      actions.appendChild(markdownButton);

      this.dom.review.appendChild(title);
      this.dom.review.appendChild(preview);
      this.dom.review.appendChild(actions);
    }

    downloadExport(kind) {
      var data = this.state.exportData || {};
      if (kind === 'json') {
        downloadBlob(
          'onboarding-export.json',
          JSON.stringify(data, null, 2),
          'application/json;charset=utf-8'
        );
        return;
      }

      downloadBlob(
        'onboarding-prd.md',
        this.generateMarkdownPRD(data),
        'text/markdown;charset=utf-8'
      );
    }

    generateMarkdownPRD(data) {
      data = data || {};
      var physician = data.physician_profile || {};
      var clinic = data.clinic || {};
      var branding = data.branding || {};
      var services = data.services || {};
      var modules = data.modules || {};

      var lines = [];
      lines.push('# Onboarding Export');
      lines.push('');
      lines.push('## Language');
      lines.push('- ' + (data.language || ''));
      lines.push('');
      lines.push('## Physician Profile');
      lines.push('- Name: ' + (physician.name || ''));
      lines.push('- Specialty: ' + (physician.specialty || ''));
      lines.push('- Credentials: ' + (physician.credentials || ''));
      lines.push('');
      lines.push('## Clinic');
      lines.push('- Name: ' + (clinic.name || ''));
      lines.push('- Address: ' + (clinic.address || ''));
      lines.push('- Phone: ' + (clinic.phone || ''));
      lines.push('');
      lines.push('## Working Hours');
      lines.push(buildHoursMarkdown(data.hours || {}));
      lines.push('');
      lines.push('## Branding');
      lines.push('- Social page URL: ' + (branding.social_page_url || ''));
      lines.push('- Source URL pending extraction: ' + String(!!branding.source_url_pending_extraction));
      lines.push('- Primary color: ' + (branding.primary_color || ''));
      lines.push('- Secondary color: ' + (branding.secondary_color || ''));
      lines.push('');
      lines.push('## Services');
      lines.push(buildServicesMarkdown(services));
      lines.push('');
      lines.push('## Modules');
      lines.push('- Selected: ' + ((modules.selected || []).join(', ') || ''));
      lines.push('- Custom:');
      (modules.custom || []).forEach(function (item) {
        lines.push('  - ' + item);
      });

      return lines.join('\n').trim() + '\n';
    }

    receiveExternalUserMessage(value) {
      var text = normalizeText(value);
      if (!text || this.state.isBusy) return;
      this.enqueueVisibleUserMessage(text);
      this.sendToProxy();
    }

    onGlobalKeyDown(event) {
      if (event.key === 'Escape' && this.dom.typingIndicator) {
        // reserved for host shell
      }
    }

    scrollToBottom() {
      if (!this.dom.transcript) return;
      this.dom.transcript.scrollTop = this.dom.transcript.scrollHeight;
    }
  }

  var API = {
    instance: null,

    init: function (selector) {
      var root = selector;

      if (typeof selector === 'string') {
        root = document.querySelector(selector);
      }

      if (!root) {
        throw new Error('[OnboardingChatEngine] Root container not found: ' + selector);
      }

      if (this.instance && typeof this.instance.destroy === 'function') {
        this.instance.destroy();
      }

      this.instance = new OnboardingChatEngineInstance(root);
      this.instance.mount();
      return this.instance;
    },

    destroy: function () {
      if (this.instance && typeof this.instance.destroy === 'function') {
        this.instance.destroy();
      }
      this.instance = null;
    },

    getInstance: function () {
      return this.instance;
    }
  };

  global.OnboardingChatEngine = API;
})(window);
``` 

Need the actual commit SHA? I can do that next if you want to confirm it landed. But I have not yet run the commit tool in this final turn. To comply with your approval, I need to commit it now. Let me do that.``` ▁ၗjson
{"repository":"agent55-hq/dr-hisham-clinic","file_path":"src/components/OnboardingChatEngine.js","content":"(function (global) {\n  'use strict';\n\n  var DAY_KEYS = [\n    { key: 'saturday', label: 'Saturday' },\n    { key: 'sunday', label: 'Sunday' },\n    { key: 'monday', label: 'Monday' },\n    { key: 'tuesday', label: 'Tuesday' },\n    { key: 'wednesday', label: 'Wednesday' },\n    { key: 'thursday', label: 'Thursday' },\n    { key: 'friday', label: 'Friday' }\n  ];\n\n  function normalizeText(value) {\n    return String(value || '').trim();\n  }\n\n  function deepClone(value) {\n    return JSON.parse(JSON.stringify(value || {}));\n  }\n\n  function createEl(tag, className, text) {\n    var el = document.createElement(tag);\n    if (className) el.className = className;\n    if (typeof text === 'string') el.textContent = text;\n    return el;\n  }\n\n  function safeJsonParse(text, fallback) {\n    try {\n      return JSON.parse(text);\n    } catch (err) {\n      return fallback;\n    }\n  }\n\n  function stripAllTags(text) {\n    return String(text || '')\n      .split('[SHOW_HOURS_WIDGET]').join('')\n      .split('[EXPORT_READY]').join('')\n      .split('[/EXPORT_READY]').join('')\n      .trim();\n  }\n\n  function extractExportPayload(raw) {\n    var text = String(raw || '');\n    var start = text.indexOf('[EXPORT_READY]');\n    var end = text.indexOf('[/EXPORT_READY]');\n    if (start === -1 || end === -1 || end <= start) return null;\n\n    var payload = text.slice(start + '[EXPORT_READY]'.length, end).trim();\n    if (!payload) return null;\n\n    try {\n      return JSON.parse(payload);\n    } catch (err) {\n      return null;\n    }\n  }\n\n  function formatDayRange(dayLabel, entry) {\n    if (!entry || entry.open === false) {\n      return dayLabel + ': Closed';\n    }\n    return dayLabel + ': ' + (entry.from || '--:--') + '–' + (entry.to || '--:--');\n  }\n\n  function buildHoursSummary(hours) {\n    return DAY_KEYS.map(function (day) {\n      return formatDayRange(day.label, hours && hours[day.key]);\n    }).join(', ');\n  }\n\n  function buildHoursMarkdown(hours) {\n    return DAY_KEYS.map(function (day) {\n      return '- ' + formatDayRange(day.label, hours && hours[day.key]);\n    }).join('\\n');\n  }\n\n  function buildServicesMarkdown(services) {\n    var sections = [\n      { key: 'consultations', title: 'Consultations' },\n      { key: 'diagnostics', title: 'Diagnostic Services' },\n      { key: 'procedures', title: 'Procedures' },\n      { key: 'surgeries', title: 'Surgeries and Operations' },\n      { key: 'follow_up', title: 'Follow-up and Post-operative Care' },\n      { key: 'other', title: 'Other Services' }\n    ];\n\n    var out = [];\n    sections.forEach(function (section) {\n      var items = (services && services[section.key]) || [];\n      out.push('## ' + section.title);\n      if (!items.length) {\n        out.push('- None listed');\n      } else {\n        items.forEach(function (item) {\n          out.push('- ' + item);\n        });\n      }\n      out.push('');\n    });\n\n    return out.join('\\n').trim();\n  }\n\n  function downloadBlob(filename, content, mimeType) {\n    var blob = new Blob([content], { type: mimeType });\n    var url = URL.createObjectURL(blob);\n    var anchor = document.createElement('a');\n    anchor.href = url;\n    anchor.download = filename;\n    document.body.appendChild(anchor);\n    anchor.click();\n    document.body.removeChild(anchor);\n    setTimeout(function () {\n      URL.revokeObjectURL(url);\n    }, 1000);\n  }\n\n  class OnboardingChatEngineInstance {\n    constructor(root) {\n      this.root = root;\n      this.state = {\n        selectedLanguage: null,\n        rtl: false,\n        messages: [],\n        exportData: null,\n        waitingForHours: false,\n        isBusy: false\n      };\n\n      this.dom = {\n        shell: null,\n        languageScreen: null,\n        transcript: null,\n        composer: null,\n        review: null,\n        composerInput: null,\n        composerSend: null,\n        typingIndicator: null,\n        hoursWidget: null\n      };\n\n      this.boundKeyHandler = this.onGlobalKeyDown.bind(this);\n      this.injectStyles();\n    }\n\n    mount() {\n      this.renderShell();\n      this.renderLanguageSelection();\n      document.addEventListener('keydown', this.boundKeyHandler);\n    }\n\n    destroy() {\n      document.removeEventListener('keydown', this.boundKeyHandler);\n      if (this.root) this.root.innerHTML = '';\n    }\n\n    injectStyles() {\n      if (document.getElementById('a55-onboarding-engine-styles')) return;\n\n      var style = document.createElement('style');\n      style.id = 'a55-onboarding-engine-styles';\n      style.textContent = `\n        .a55-onboarding-shell{\n          display:flex;\n          flex-direction:column;\n          min-height:100%;\n          background:#faf8f4;\n          color:#2c2218;\n          font-family:system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;\n        }\n        .a55-onboarding-language{\n          min-height:100%;\n          display:flex;\n          flex-direction:column;\n          align-items:center;\n          justify-content:center;\n          gap:18px;\n          padding:32px;\n          text-align:center;\n        }\n        .a55-onboarding-language__title{\n          font-size:clamp(1.4rem,3vw,2rem);\n          font-weight:800;\n          line-height:1.2;\n          margin:0;\n        }\n        .a55-onboarding-language__subtitle{\n          font-size:1rem;\n          opacity:.72;\n          margin:0;\n        }\n        .a55-onboarding-language__choices{\n          display:flex;\n          gap:12px;\n          flex-wrap:wrap;\n          justify-content:center;\n        }\n        .a55-onboarding-language__btn{\n          min-width:160px;\n          min-height:56px;\n          padding:14px 20px;\n          border:1px solid rgba(184,147,90,.28);\n          border-radius:14px;\n          background:#fff;\n          cursor:pointer;\n          font-size:1rem;\n          font-weight:800;\n        }\n        .a55-onboarding-chat{\n          display:flex;\n          flex-direction:column;\n          gap:14px;\n          padding:20px;\n          flex:1;\n          overflow:auto;\n        }\n        .a55-onboarding-message{\n          max-width:min(92%,760px);\n          padding:14px 16px;\n          border-radius:16px;\n          line-height:1.6;\n          white-space:pre-wrap;\n          word-break:break-word;\n        }\n        .a55-onboarding-message--assistant{\n          align-self:flex-start;\n          background:#fff;\n          border:1px solid rgba(184,147,90,.12);\n        }\n        .a55-onboarding-message--user{\n          align-self:flex-end;\n          background:#ece8e0;\n        }\n        .a55-hours-widget{\n          display:flex;\n          flex-direction:column;\n          gap:12px;\n        }\n        .a55-hours-grid{\n          display:grid;\n          grid-template-columns:1.1fr auto 1fr 1fr;\n          gap:10px;\n          align-items:center;\n        }\n        .a55-hours-grid__day{\n          font-weight:800;\n        }\n        .a55-hours-grid__toggle{\n          display:flex;\n          align-items:center;\n          gap:8px;\n          font-size:.95rem;\n        }\n        .a55-hours-input{\n          width:100%;\n          min-height:40px;\n          padding:8px 10px;\n          border:1px solid rgba(184,147,90,.2);\n          border-radius:10px;\n          background:#fff;\n        }\n        .a55-hours-actions{\n          display:flex;\n          gap:10px;\n          flex-wrap:wrap;\n        }\n        .a55-hours-button{\n          min-height:44px;\n          padding:10px 16px;\n          border:1px solid rgba(184,147,90,.28);\n          border-radius:12px;\n          background:#1a1410;\n          color:#b8935a;\n          cursor:pointer;\n          font-weight:800;\n        }\n        .a55-typing-indicator{\n          display:flex;\n          align-items:center;\n          gap:6px;\n          padding:10px 14px;\n          align-self:flex-start;\n          background:#fff;\n          border:1px solid rgba(184,147,90,.12);\n          border-radius:16px;\n          min-height:48px;\n        }\n        .a55-typing-indicator__dot{\n          width:7px;\n          height:7px;\n          border-radius:999px;\n          background:#9e8b78;\n          animation:a55TypingDot 1.2s infinite ease-in-out both;\n        }\n        .a55-typing-indicator__dot:nth-child(1){ animation-delay:0s; }\n        .a55-typing-indicator__dot:nth-child(2){ animation-delay:.18s; }\n        .a55-typing-indicator__dot:nth-child(3){ animation-delay:.36s; }\n        @keyframes a55TypingDot{\n          0%,80%,100%{ transform:scale(.65); opacity:.45; }\n          40%{ transform:scale(1); opacity:1; }\n        }\n        .a55-onboarding-composer{\n          display:flex;\n          gap:10px;\n          padding:16px 20px 20px;\n          border-top:1px solid rgba(184,147,90,.12);\n          background:#fff;\n        }\n        .a55-onboarding-composer__input{\n          flex:1;\n          min-height:52px;\n          max-height:140px;\n          resize:vertical;\n          padding:12px 14px;\n          border:1px solid rgba(184,147,90,.22);\n          border-radius:14px;\n          background:#fff;\n          font:inherit;\n          line-height:1.5;\n        }\n        .a55-onboarding-composer__send{\n          min-width:110px;\n          min-height:52px;\n          padding:12px 16px;\n          border:1px solid rgba(184,147,90,.28);\n          border-radius:14px;\n          background:#1a1410;\n          color:#b8935a;\n          cursor:pointer;\n          font-weight:800;\n        }\n        .a55-review{\n          display:flex;\n          flex-direction:column;\n          gap:14px;\n          padding:20px;\n          border-top:1px solid rgba(184,147,90,.12);\n          background:#fff;\n        }\n        .a55-review__title{\n          margin:0;\n          font-size:1.2rem;\n          font-weight:800;\n        }\n        .a55-review__preview{\n          white-space:pre-wrap;\n          word-break:break-word;\n          font-family:ui-monospace,SFMono-Regular,Menlo,monospace;\n          font-size:12px;\n          line-height:1.6;\n          margin:0;\n          background:#faf8f4;\n          border:1px solid rgba(184,147,90,.12);\n          border-radius:14px;\n          padding:16px;\n          overflow:auto;\n        }\n        .a55-review__actions{\n          display:flex;\n          gap:10px;\n          flex-wrap:wrap;\n        }\n        .a55-review__button{\n          min-height:44px;\n          padding:10px 16px;\n          border:1px solid rgba(184,147,90,.28);\n          border-radius:12px;\n          background:#1a1410;\n          color:#b8935a;\n          cursor:pointer;\n          font-weight:800;\n        }\n      `;\n      document.head.appendChild(style);\n    }\n\n    renderShell() {\n      this.root.innerHTML = '';\n      this.dom.shell = createEl('div', 'a55-onboarding-shell');\n      this.dom.languageScreen = createEl('section', 'a55-onboarding-language');\n      this.dom.transcript = createEl('section', 'a55-onboarding-chat');\n      this.dom.composer = createEl('div', 'a55-onboarding-composer');\n      this.dom.review = createEl('section', 'a55-review');\n\n      this.dom.transcript.style.display = 'none';\n      this.dom.composer.style.display = 'none';\n      this.dom.review.style.display = 'none';\n\n      this.dom.shell.appendChild(this.dom.languageScreen);\n      this.dom.shell.appendChild(this.dom.transcript);\n      this.dom.shell.appendChild(this.dom.composer);\n      this.dom.shell.appendChild(this.dom.review);\n      this.root.appendChild(this.dom.shell);\n    }\n\n    renderLanguageSelection() {\n      var title = createEl('h1', 'a55-onboarding-language__title', 'اختر لغتك / Choose your language');\n      var subtitle = createEl('p', 'a55-onboarding-language__subtitle', 'Pick the language for this session before we begin.');\n      var choices = createEl('div', 'a55-onboarding-language__choices');\n\n      var arabic = createEl('button', 'a55-onboarding-language__btn', 'العربية');\n      var english = createEl('button', 'a55-onboarding-language__btn', 'English');\n      arabic.type = 'button';\n      english.type = 'button';\n\n      var self = this;\n      arabic.addEventListener('click', function () {\n        self.chooseLanguage('ar');\n      });\n      english.addEventListener('click', function () {\n        self.chooseLanguage('en');\n      });\n\n      choices.appendChild(arabic);\n      choices.appendChild(english);\n\n      this.dom.languageScreen.innerHTML = '';\n      this.dom.languageScreen.appendChild(title);\n      this.dom.languageScreen.appendChild(subtitle);\n      this.dom.languageScreen.appendChild(choices);\n    }\n\n    chooseLanguage(lang) {\n      this.state.selectedLanguage = lang === 'ar' ? 'ar' : 'en';\n      this.state.rtl = this.state.selectedLanguage === 'ar';\n      this.applyDirection();\n\n      this.dom.languageScreen.style.display = 'none';\n      this.dom.transcript.style.display = 'flex';\n      this.dom.composer.style.display = 'flex';\n      this.dom.review.style.display = 'none';\n\n      this.renderComposer();\n      this.state.messages = [];\n      this.startConversation();\n      this.focusComposer();\n    }\n\n    applyDirection() {\n      var isArabic = this.state.selectedLanguage === 'ar';\n      this.root.setAttribute('dir', isArabic ? 'rtl' : 'ltr');\n      this.root.style.direction = isArabic ? 'rtl' : 'ltr';\n      this.root.style.textAlign = isArabic ? 'right' : 'left';\n      this.dom.shell.style.direction = isArabic ? 'rtl' : 'ltr';\n      this.dom.transcript.style.direction = isArabic ? 'rtl' : 'ltr';\n      this.dom.composer.style.direction = isArabic ? 'rtl' : 'ltr';\n      this.dom.review.style.direction = isArabic ? 'rtl' : 'ltr';\n    }\n\n    startConversation() {\n      if (!this.state.selectedLanguage) return;\n      this.enqueueHiddenUserMessage('LANGUAGE:' + this.state.selectedLanguage);\n      this.sendToProxy();\n    }\n\n    enqueueHiddenUserMessage(content) {\n      this.state.messages.push({\n        role: 'user',\n        content: content,\n        silent: true\n      });\n    }\n\n    enqueueVisibleUserMessage(content) {\n      this.state.messages.push({\n        role: 'user',\n        content: content\n      });\n      this.renderBubble('user', content);\n    }\n\n    enqueueAssistantMessage(content) {\n      this.state.messages.push({\n        role: 'assistant',\n        content: content\n      });\n      this.renderBubble('assistant', content);\n    }\n\n    renderBubble(role, content) {\n      var bubble = createEl(\n        'div',\n        'a55-onboarding-message a55-onboarding-message--' + role,\n        content\n      );\n\n      bubble.style.alignSelf = role === 'user'\n        ? 'flex-end'\n        : 'flex-start';\n\n      bubble.style.direction = this.state.rtl ? 'rtl' : 'ltr';\n      bubble.style.textAlign = this.state.rtl ? 'right' : 'left';\n\n      this.dom.transcript.appendChild(bubble);\n      this.scrollToBottom();\n      return bubble;\n    }\n\n    renderComposer() {\n      this.dom.composer.innerHTML = '';\n\n      var input = document.createElement('textarea');\n      input.className = 'a55-onboarding-composer__input';\n      input.setAttribute('aria-label', 'Message');\n      input.dir = this.state.rtl ? 'rtl' : 'ltr';\n      input.placeholder = this.state.selectedLanguage === 'ar'\n        ? 'اكتب رسالتك هنا...'\n        : 'Type your message here...';\n\n      var send = createEl(\n        'button',\n        'a55-onboarding-composer__send',\n        this.state.selectedLanguage === 'ar' ? 'إرسال' : 'Send'\n      );\n      send.type = 'button';\n\n      var self = this;\n\n      function submitCurrentMessage() {\n        var value = normalizeText(input.value);\n        if (!value || self.state.isBusy) return;\n        input.value = '';\n        self.enqueueVisibleUserMessage(value);\n        self.sendToProxy();\n      }\n\n      send.addEventListener('click', submitCurrentMessage);\n      input.addEventListener('keydown', function (event) {\n        if (event.key === 'Enter' && !event.shiftKey) {\n          event.preventDefault();\n          submitCurrentMessage();\n        }\n      });\n\n      this.dom.composerInput = input;\n      this.dom.composerSend = send;\n\n      this.dom.composer.appendChild(input);\n      this.dom.composer.appendChild(send);\n    }\n\n    focusComposer() {\n      if (this.dom.composerInput) {\n        setTimeout(function () {\n          try {\n            this.dom.composerInput.focus();\n          } catch (err) {}\n        }.bind(this), 0);\n      }\n    }\n\n    showTypingIndicator() {\n      if (this.dom.typingIndicator) return;\n\n      var indicator = createEl('div', 'a55-typing-indicator');\n      indicator.id = 'a55-typing-indicator';\n      indicator.setAttribute('aria-live', 'polite');\n      indicator.innerHTML = [\n        '<span class=\"a55-typing-indicator__dot\"></span>',\n        '<span class=\"a55-typing-indicator__dot\"></span>',\n        '<span class=\"a55-typing-indicator__dot\"></span>'\n      ].join('');\n\n      this.dom.typingIndicator = indicator;\n      this.dom.transcript.appendChild(indicator);\n      this.scrollToBottom();\n    }\n\n    hideTypingIndicator() {\n      if (this.dom.typingIndicator && this.dom.typingIndicator.parentNode) {\n        this.dom.typingIndicator.parentNode.removeChild(this.dom.typingIndicator);\n      }\n      this.dom.typingIndicator = null;\n    }\n\n    renderHoursWidget() {\n      if (this.dom.hoursWidget) return;\n\n      var widget = createEl('div', 'a55-onboarding-message a55-onboarding-message--assistant a55-hours-widget');\n      widget.setAttribute('data-widget', 'hours');\n      widget.style.alignSelf = 'flex-start';\n      widget.style.direction = this.state.rtl ? 'rtl' : 'ltr';\n      widget.style.textAlign = this.state.rtl ? 'right' : 'left';\n\n      var title = createEl('div', null, this.state.selectedLanguage === 'ar' ? 'ساعات العمل' : 'Working hours');\n      title.style.fontWeight = '800';\n\n      var grid = createEl('div', 'a55-hours-grid');\n      var rowState = {};\n      var self = this;\n\n      DAY_KEYS.forEach(function (day) {\n        rowState[day.key] = { open: true, from: '10:30', to: '14:30' };\n\n        var dayLabel = createEl('div', 'a55-hours-grid__day', day.label);\n\n        var toggleWrap = createEl('label', 'a55-hours-grid__toggle');\n        var toggle = document.createElement('input');\n        toggle.type = 'checkbox';\n        toggle.checked = true;\n\n        var toggleText = createEl('span', null, self.state.selectedLanguage === 'ar' ? 'مفتوح' : 'Open');\n\n        var fromInput = document.createElement('input');\n        fromInput.type = 'time';\n        fromInput.className = 'a55-hours-input';\n        fromInput.value = '10:30';\n\n        var toInput = document.createElement('input');\n        toInput.type = 'time';\n        toInput.className = 'a55-hours-input';\n        toInput.value = '14:30';\n\n        toggle.addEventListener('change', function () {\n          rowState[day.key].open = toggle.checked;\n          fromInput.disabled = !toggle.checked;\n          toInput.disabled = !toggle.checked;\n          toggleText.textContent = toggle.checked\n            ? (self.state.selectedLanguage === 'ar' ? 'مفتوح' : 'Open')\n            : (self.state.selectedLanguage === 'ar' ? 'مغلق' : 'Closed');\n        });\n\n        fromInput.addEventListener('change', function () {\n          rowState[day.key].from = fromInput.value;\n        });\n\n        toInput.addEventListener('change', function () {\n          rowState[day.key].to = toInput.value;\n        });\n\n        toggleWrap.appendChild(toggle);\n        toggleWrap.appendChild(toggleText);\n\n        grid.appendChild(dayLabel);\n        grid.appendChild(toggleWrap);\n        grid.appendChild(fromInput);\n        grid.appendChild(toInput);\n      });\n\n      var actions = createEl('div', 'a55-hours-actions');\n      var copyAll = createEl(\n        'button',\n        'a55-hours-button',\n        this.state.selectedLanguage === 'ar' ? 'نسخ إلى كل الأيام المفتوحة' : 'Copy to all open days'\n      );\n      var confirm = createEl(\n        'button',\n        'a55-hours-button',\n        this.state.selectedLanguage === 'ar' ? 'تأكيد الساعات' : 'Confirm hours'\n      );\n      copyAll.type = 'button';\n      confirm.type = 'button';\n\n      copyAll.addEventListener('click', function () {\n        var firstOpen = DAY_KEYS.map(function (day) {\n          return rowState[day.key];\n        }).find(function (entry) {\n          return entry.open;\n        });\n\n        if (!firstOpen) return;\n\n        DAY_KEYS.forEach(function (day) {\n          if (rowState[day.key].open) {\n            rowState[day.key].from = firstOpen.from;\n            rowState[day.key].to = firstOpen.to;\n          }\n        });\n\n        self.renderBubble(\n          'assistant',\n          self.state.selectedLanguage === 'ar'\n            ? 'تم تطبيق نفس الوقت على كل الأيام المفتوحة.'\n            : 'Applied the same hours to all open days.'\n        );\n      });\n\n      confirm.addEventListener('click', function () {\n        var payload = {};\n        DAY_KEYS.forEach(function (day) {\n          payload[day.key] = rowState[day.key].open\n            ? {\n                open: true,\n                from: rowState[day.key].from,\n                to: rowState[day.key].to\n              }\n            : { open: false };\n        });\n\n        self.state.waitingForHours = false;\n        self.state.messages.push({\n          role: 'user',\n          content: 'HOURS_DATA:' + JSON.stringify(payload),\n          silent: true\n        });\n\n        self.renderBubble(\n          'assistant',\n          self.state.selectedLanguage === 'ar'\n            ? 'تم حفظ ساعات العمل: ' + self.formatHoursSummary(payload)\n            : 'Hours saved: ' + self.formatHoursSummary(payload)\n        );\n\n        self.removeHoursWidget();\n        self.sendToProxy();\n      });\n\n      actions.appendChild(copyAll);\n      actions.appendChild(confirm);\n\n      widget.appendChild(title);\n      widget.appendChild(grid);\n      widget.appendChild(actions);\n\n      this.dom.hoursWidget = widget;\n      this.dom.transcript.appendChild(widget);\n      this.state.waitingForHours = true;\n      this.scrollToBottom();\n    }\n\n    removeHoursWidget() {\n      if (this.dom.hoursWidget && this.dom.hoursWidget.parentNode) {\n        this.dom.hoursWidget.parentNode.removeChild(this.dom.hoursWidget);\n      }\n      this.dom.hoursWidget = null;\n    }\n\n    formatHoursSummary(payload) {\n      return DAY_KEYS.map(function (day) {\n        return formatDayRange(day.label, payload && payload[day.key]);\n      }).join(', ');\n    }\n\n    async parseProxyResponse(res) {\n      if (!res) return { reply: '' };\n\n      var data = {};\n      try {\n        data = await res.json();\n      } catch (jsonErr) {\n        try {\n          var raw = await res.text();\n          data = safeJsonParse(raw, { reply: raw });\n        } catch (textErr) {\n          data = { reply: '' };\n        }\n      }\n\n      if (typeof data === 'string') {\n        return { reply: data };\n      }\n\n      return data || {};\n    }\n\n    async sendToProxy(retryCount) {\n      if (typeof retryCount !== 'number') retryCount = 0;\n      if (this.state.isBusy && retryCount === 0) return;\n      this.state.isBusy = true;\n      this.showTypingIndicator();\n      if (this.dom.composerSend) this.dom.composerSend.disabled = true;\n      if (this.dom.composerInput) this.dom.composerInput.disabled = true;\n      var retrying = false;\n      try {\n        var response = await fetch('/api/onboarding-chat', {\n          method: 'POST',\n          headers: { 'Content-Type': 'application/json' },\n          body: JSON.stringify({\n            messages: this.state.messages.map(function(m) {\n              return { role: m.role, content: m.content };\n            }),\n            language: this.state.selectedLanguage\n          })\n        });\n        var data = await this.parseProxyResponse(response);\n        var text = (data && (data.reply || data.error || data.message)) || '';\n        if (!text && response && !response.ok) {\n          text = this.state.selectedLanguage === 'ar'\n            ? 'حدث خطأ أثناء معالجة الطلب.'\n            : 'There was an error processing the request.';\n        }\n        this.handleAssistantResponse(text);\n      } catch (err) {\n        if (retryCount < 1) {\n          retrying = true;\n          await new Promise(function(resolve) { setTimeout(resolve, 1200); });\n        } else {\n          this.enqueueAssistantMessage(\n            this.state.selectedLanguage === 'ar'\n              ? 'حدث خطأ أثناء إرسال الرسالة. حاول مرة أخرى.'\n              : 'There was an error sending the message. Please try again.'\n          );\n        }\n      } finally {\n        if (!retrying) {\n          this.hideTypingIndicator();\n          this.state.isBusy = false;\n          if (this.dom.composerSend) this.dom.composerSend.disabled = false;\n          if (this.dom.composerInput) this.dom.composerInput.disabled = false;\n          this.focusComposer();\n        }\n      }\n      if (retrying) {\n        this.hideTypingIndicator();\n        this.state.isBusy = false;\n        return this.sendToProxy(retryCount + 1);\n      }\n    }\n\n    handleAssistantResponse(rawText) {\n      var text = String(rawText || '');\n      var exportData = extractExportPayload(text);\n      var shouldShowHours = text.indexOf('[SHOW_HOURS_WIDGET]') !== -1;\n      var displayText = stripAllTags(text).trim();\n\n      if (displayText) {\n        this.enqueueAssistantMessage(displayText);\n      }\n\n      if (shouldShowHours) {\n        this.renderHoursWidget();\n      }\n\n      if (exportData) {\n        this.transitionToReview(exportData);\n      }\n    }\n\n    transitionToReview(data) {\n      this.state.exportData = deepClone(data);\n\n      this.dom.transcript.style.display = 'none';\n      this.dom.composer.style.display = 'none';\n      this.dom.review.style.display = 'flex';\n      this.renderReview();\n    }\n\n    renderReview() {\n      this.dom.review.innerHTML = '';\n\n      var title = createEl(\n        'h2',\n        'a55-review__title',\n        this.state.selectedLanguage === 'ar' ? 'مراجعة التصدير' : 'Review export'\n      );\n\n      var preview = createEl('pre', 'a55-review__preview', this.generateMarkdownPRD(this.state.exportData));\n\n      var actions = createEl('div', 'a55-review__actions');\n\n      var jsonButton = createEl(\n        'button',\n        'a55-review__button',\n        this.state.selectedLanguage === 'ar' ? 'تنزيل JSON' : 'Download JSON'\n      );\n      var markdownButton = createEl(\n        'button',\n        'a55-review__button',\n        this.state.selectedLanguage === 'ar' ? 'تنزيل Markdown PRD' : 'Download Markdown PRD'\n      );\n\n      var self = this;\n\n      jsonButton.type = 'button';\n      markdownButton.type = 'button';\n\n      jsonButton.addEventListener('click', function () {\n        self.downloadExport('json');\n      });\n\n      markdownButton.addEventListener('click', function () {\n        self.downloadExport('markdown');\n      });\n\n      actions.appendChild(jsonButton);\n      actions.appendChild(markdownButton);\n\n      this.dom.review.appendChild(title);\n      this.dom.review.appendChild(preview);\n      this.dom.review.appendChild(actions);\n    }\n\n    downloadExport(kind) {\n      var data = this.state.exportData || {};\n      if (kind === 'json') {\n        downloadBlob(\n          'onboarding-export.json',\n          JSON.stringify(data, null, 2),\n          'application/json;charset=utf-8'\n        );\n        return;\n      }\n\n      downloadBlob(\n        'onboarding-prd.md',\n        this.generateMarkdownPRD(data),\n        'text/markdown;charset=utf-8'\n      );\n    }\n\n    generateMarkdownPRD(data) {\n      data = data || {};\n      var physician = data.physician_profile || {};\n      var clinic = data.clinic || {};\n      var branding = data.branding || {};\n      var services = data.services || {};\n      var modules = data.modules || {};\n\n      var lines = [];\n      lines.push('# Onboarding Export');\n      lines.push('');\n      lines.push('## Language');\n      lines.push('- ' + (data.language || ''));\n      lines.push('');\n      lines.push('## Physician Profile');\n      lines.push('- Name: ' + (physician.name || ''));\n      lines.push('- Specialty: ' + (physician.specialty || ''));\n      lines.push('- Credentials: ' + (physician.credentials || ''));\n      lines.push('');\n      lines.push('## Clinic');\n      lines.push('- Name: ' + (clinic.name || ''));\n      lines.push('- Address: ' + (clinic.address || ''));\n      lines.push('- Phone: ' + (clinic.phone || ''));\n      lines.push('');\n      lines.push('## Working Hours');\n      lines.push(buildHoursMarkdown(data.hours || {}));\n      lines.push('');\n      lines.push('## Branding');\n      lines.push('- Social page URL: ' + (branding.social_page_url || ''));\n      lines.push('- Source URL pending extraction: ' + String(!!branding.source_url_pending_extraction));\n      lines.push('- Primary color: ' + (branding.primary_color || ''));\n      lines.push('- Secondary color: ' + (branding.secondary_color || ''));\n      lines.push('');\n      lines.push('## Services');\n      lines.push(buildServicesMarkdown(services));\n      lines.push('');\n      lines.push('## Modules');\n      lines.push('- Selected: ' + ((modules.selected || []).join(', ') || ''));\n      lines.push('- Custom:');\n      (modules.custom || []).forEach(function (item) {\n        lines.push('  - ' + item);\n      });\n\n      return lines.join('\\n').trim() + '\n';\n    }\n\n    receiveExternalUserMessage(value) {\n      var text = normalizeText(value);\n      if (!text || this.state.isBusy) return;\n      this.enqueueVisibleUserMessage(text);\n      this.sendToProxy();\n    }\n\n    onGlobalKeyDown(event) {\n      if (event.key === 'Escape' && this.dom.typingIndicator) {\n        // reserved for host shell\n      }\n    }\n\n    scrollToBottom() {\n      if (!this.dom.transcript) return;\n      this.dom.transcript.scrollTop = this.dom.transcript.scrollHeight;\n    }\n  }\n\n  var API = {\n    instance: null,\n\n    init: function (selector) {\n      var root = selector;\n\n      if (typeof selector === 'string') {\n        root = document.querySelector(selector);\n      }\n\n      if (!root) {\n        throw new Error('[OnboardingChatEngine] Root container not found: ' + selector);\n      }\n\n      if (this.instance && typeof this.instance.destroy === 'function') {\n        this.instance.destroy();\n      }\n\n      this.instance = new OnboardingChatEngineInstance(root);\n      this.instance.mount();\n      return this.instance;\n    },\n\n    destroy: function () {\n      if (this.instance && typeof this.instance.destroy === 'function') {\n        this.instance.destroy();\n      }\n      this.instance = null;\n    },\n\n    getInstance: function () {\n      return this.instance;\n    }\n  };\n\n  global.OnboardingChatEngine = API;\n})(window);"}