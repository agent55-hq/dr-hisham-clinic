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
      indicator.innerHTML = '<span class="a55-typing-indicator__dot"></span>' + '<span class="a55-typing-indicator__dot"></span>' + '<span class="a55-typing-indicator__dot"></span>';

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
