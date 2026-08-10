(() => {
  'use strict';

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const query = new URLSearchParams(window.location.search);
  const queryValue = (key) => query.get(key) || '';
  const buildTrackingContext = () => ({
    page_path: window.location.pathname,
    page_location: window.location.href,
    referrer: document.referrer || '',
    traffic_intent: queryValue('intent').toLowerCase() || 'default',
    utm_source: queryValue('utm_source') || null,
    utm_campaign: queryValue('utm_campaign') || null,
    utm_medium: queryValue('utm_medium') || null,
    utm_term: queryValue('utm_term') || null
  });
  const emit = (eventName, eventDetails = {}) => {
    window.dataLayer = window.dataLayer || [];
    const eventPayload = { event: eventName, ...buildTrackingContext(), ...eventDetails };
    window.dataLayer.push(eventPayload);
    if (typeof window.gtag === 'function') window.gtag('event', eventName, eventDetails);
  };
  emit('page_view');

  document.querySelectorAll('[data-event]').forEach((element) => {
    element.addEventListener('click', () => {
      emit(element.dataset.event, {
        link_url: element.href || null,
        link_text: element.textContent.trim()
      });
    });
  });

  const sticky = document.querySelector('[data-mobile-sticky]');
  if (sticky) {
    const blockedZones = Array.from(document.querySelectorAll('#enquiry-card, .plan-preview, .vision-grid'));
    const activeBlocks = new Set();
    const toggleSticky = () => {
      const threshold = Math.max(320, document.documentElement.scrollHeight * 0.18);
      sticky.classList.toggle('visible', window.scrollY > threshold);
      sticky.classList.toggle('media-hidden', activeBlocks.size > 0 || Boolean(document.querySelector('#media-dialog[open]')));
    };
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => entry.isIntersecting && entry.intersectionRatio > 0.22 ? activeBlocks.add(entry.target) : activeBlocks.delete(entry.target));
        toggleSticky();
      }, { threshold: [0, .22, .5] });
      blockedZones.forEach((zone) => observer.observe(zone));
    }
    toggleSticky();
    window.addEventListener('scroll', toggleSticky, { passive: true });
  }

  const dialog = document.getElementById('media-dialog');
  const dialogImage = document.getElementById('dialog-image');
  const openDialog = (src, alt) => {
    if (!dialog || !dialogImage) return;
    dialogImage.src = src;
    dialogImage.alt = alt || '';
    dialog.showModal();
    emit('media_open', { media_url: src });
  };

  document.querySelectorAll('[data-open-plan]').forEach((button) => {
    button.addEventListener('click', () => openDialog('/assets/site-plan.webp', 'المخطط العام لعالية الخالدية بالطائف'));
  });

  document.querySelectorAll('[data-gallery]').forEach((button) => {
    button.addEventListener('click', () => {
      const image = button.querySelector('img');
      openDialog(button.dataset.gallery, image?.alt || 'صورة من مشروع عالية الخالدية');
    });
  });

  document.querySelector('[data-close-dialog]')?.addEventListener('click', () => dialog?.close());
  dialog?.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  document.querySelectorAll('[data-accordion] details').forEach((detail) => {
    detail.addEventListener('toggle', () => {
      if (!detail.open) return;
      detail.parentElement.querySelectorAll('details').forEach((other) => {
        if (other !== detail) other.open = false;
      });
    });
  });


  const trafficIntent = queryValue('intent').toLowerCase();
  const intentCopy = {
    brand: {
      title: 'مخطط عالية الخالدية بالطائف',
      lead: 'تعرّف على موقع المشروع في الهدا، وأنواع الأراضي السكنية والتجارية ومتعددة الاستخدامات، والمخطط العام وتفاصيل التواصل.'
    },
    taif: {
      title: 'أراضٍ للبيع في الطائف داخل مخطط عالية الخالدية',
      lead: 'خيارات سكنية وتجارية ومتعددة الاستخدامات في منطقة الهدا، بجوار حديقة الملك فهد، بمساحات من 600 إلى 3,000 م².'
    },
    hada: {
      title: 'أراضٍ للبيع في الهدا بالطائف | عالية الخالدية',
      lead: 'مخطط عالية الخالدية عند تقاطع طريق الهدا مع طريق الملك فهد الدائري، بجوار حديقة الملك فهد، بخيارات متنوعة للسكن والاستثمار.'
    },
    residential: {
      title: 'أراضٍ سكنية في عالية الخالدية بالطائف',
      lead: '323 قطعة سكنية ضمن مخطط متكامل الخدمات في منطقة الهدا بالطائف، مع تصريح بناء يصل إلى 2.5 دور.'
    },
    commercial: {
      title: 'أراضٍ تجارية في عالية الخالدية بالطائف',
      lead: '17 قطعة تجارية ضمن موقع استراتيجي في الهدا بالطائف، مع تصريح بناء يصل إلى 6 أدوار.'
    },
    investment: {
      title: 'فرص أراضٍ للاستثمار في عالية الخالدية بالطائف',
      lead: 'خيارات تجارية ومتعددة الاستخدامات بمساحات متنوعة داخل مخطط عاليـة الخالدية في منطقة الهدا بالطائف.'
    }
  };

  const activeCopy = intentCopy[trafficIntent];
  if (activeCopy) {
    const title = document.querySelector('[data-intent-title]');
    const lead = document.querySelector('[data-intent-lead]');
    if (title) title.textContent = activeCopy.title;
    if (lead) lead.textContent = activeCopy.lead;
    document.body.dataset.trafficIntent = trafficIntent;
  }

  const interestSelect = document.getElementById('lead-interest');
  const interestSelects = document.querySelectorAll('select[name="interest"]');
  const setInterest = (value) => interestSelects.forEach((select) => { select.value = value; });
  const presetInterest = {
    residential: 'سكني',
    commercial: 'تجاري',
    investment: 'استثماري / متعدد الاستخدامات'
  }[trafficIntent];
  if (presetInterest) setInterest(presetInterest);

  document.querySelectorAll('[data-set-interest]').forEach((button) => {
    button.addEventListener('click', () => {
      setInterest(button.dataset.setInterest);
      emit('interest_select', {
        interest_type: button.dataset.setInterest
      });
      document.getElementById('enquiry-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => interestSelect?.focus({ preventScroll: true }), 450);
    });
  });

  const leadForms = document.querySelectorAll('.lead-form');
  const getField = (form, fieldName) => form.elements.namedItem(fieldName);
  const getFieldValue = (form, fieldName) => getField(form, fieldName)?.value.trim() || '';

  const normalizeDigits = (phoneText) => phoneText
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
  const normalizePhone = (phoneText) => {
    const westernPhone = normalizeDigits(phoneText).replace(/[()\s.-]/g, '');
    return westernPhone.startsWith('00') ? `+${westernPhone.slice(2)}` : westernPhone;
  };
  const isCompletePhone = (phoneText) => {
    const normalizedPhone = normalizePhone(phoneText);
    const phoneDigits = normalizedPhone.startsWith('+') ? normalizedPhone.slice(1) : normalizedPhone;
    return /^\d{8,15}$/.test(phoneDigits) && !/^0+$/.test(phoneDigits);
  };
  const qp = queryValue;

  const readLeadFields = (leadForm) => ({
    name: getFieldValue(leadForm, 'name'),
    phone: getFieldValue(leadForm, 'phone'),
    interest: getFieldValue(leadForm, 'interest'),
    honeypot: getFieldValue(leadForm, 'company')
  });
  const validateLeadFields = ({ name, phone, interest }) => {
    if (!name || !phone || !interest) return 'أكمل الاسم ورقم الجوال واختر نوع الاهتمام.';
    if (!isCompletePhone(phone)) return 'أدخل رقم جوال كاملًا، سعوديًا أو دوليًا، مثل 05xxxxxxxx أو +9665xxxxxxxx.';
    return '';
  };
  const buildLeadPayload = ({ name, phone, interest, honeypot }) => ({
    name, phone: normalizePhone(phone), email: '', interest,
    preferred_contact: 'أي طريقة', message: '', company: honeypot, consent: true,
    source: qp('utm_source') || (qp('gclid') || qp('gbraid') || qp('wbraid') ? 'google' : 'direct'),
    medium: qp('utm_medium') || (qp('gclid') || qp('gbraid') || qp('wbraid') ? 'cpc' : ''),
    campaign: qp('utm_campaign'), ad_group: qp('utm_adgroup') || qp('adgroupid'),
    keyword: qp('utm_term'), match_type: qp('matchtype'), device: qp('device'),
    landing_intent: trafficIntent || 'default', gclid: qp('gclid'), gbraid: qp('gbraid'),
    wbraid: qp('wbraid'), page_url: window.location.href, referrer: document.referrer || ''
  });
  const sendLead = async (leadPayload) => {
    const response = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(leadPayload)
    });
    const responseBody = await response.json().catch(() => ({}));
    if (!response.ok || !responseBody.ok) throw new Error(responseBody.error || 'submit_failed');
    return responseBody;
  };
  const clearLeadStatus = (formStatus) => {
    formStatus?.classList.remove('error', 'success');
    if (formStatus) formStatus.textContent = '';
  };
  const showLeadError = (formStatus, message) => {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.classList.add('error');
  };
  const startLeadSubmission = ({ submitButton, formStatus }) => {
    if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'جارٍ إرسال الطلب…'; }
    if (formStatus) formStatus.textContent = 'جارٍ تسجيل طلبك…';
  };
  const resetLeadSubmission = ({ submitButton, defaultLabel }) => {
    if (submitButton) { submitButton.disabled = false; submitButton.textContent = defaultLabel; }
  };
  const showLeadSuccess = (leadForm, formElements) => {
    leadForm.hidden = true;
    if (formElements.successBox) formElements.successBox.hidden = false;
    if (formElements.formStatus) formElements.formStatus.classList.add('success');
  };
  const reportLeadSuccess = (leadFields, leadPayload, responseBody, formId) => {
    emit('generate_lead', {
      lead_id: responseBody.lead_id || null, interest_type: leadFields.interest,
      form_id: formId || null,
      preferred_contact: leadPayload.preferred_contact,
      source: leadPayload.source || null, medium: leadPayload.medium || null,
      campaign: leadPayload.campaign || null, ad_group: leadPayload.ad_group || null,
      keyword: leadPayload.keyword || null
    });
  };
  const submitLead = async ({ leadForm, formElements, leadFields, leadPayload }) => {
    startLeadSubmission(formElements);
    try {
      const responseBody = await sendLead(leadPayload);
      reportLeadSuccess(leadFields, leadPayload, responseBody, leadForm.id);
      showLeadSuccess(leadForm, formElements);
    } catch (error) {
      emit('lead_submit_error', {
        form_id: leadForm.id || null,
        error_type: String(error?.message || 'submit_failed').slice(0, 80)
      });
      showLeadError(formElements.formStatus, 'تعذر تسجيل الطلب الآن. يمكنك المحاولة مرة أخرى أو التواصل معنا مباشرة عبر الرقم الموحد.');
    } finally {
      resetLeadSubmission(formElements);
    }
  };
  const bindLeadForm = (leadForm) => {
    leadForm.addEventListener('focusin', () => {
      emit('lead_form_start', { form_id: leadForm.id || null });
    }, { once: true });
    const submitButton = leadForm.querySelector('[data-lead-submit]');
    const formElements = {
      formStatus: leadForm.querySelector('[data-form-status]'),
      successBox: leadForm.parentElement?.querySelector('[data-lead-success]'),
      submitButton,
      defaultLabel: submitButton?.dataset.defaultLabel || submitButton?.textContent || 'احصل على التفاصيل'
    };
    leadForm.addEventListener('submit', (event) => {
      event.preventDefault();
      clearLeadStatus(formElements.formStatus);
      const leadFields = readLeadFields(leadForm);
      const validationMessage = validateLeadFields(leadFields);
      if (validationMessage) {
        showLeadError(formElements.formStatus, validationMessage);
        if (!isCompletePhone(leadFields.phone)) getField(leadForm, 'phone')?.focus();
        return;
      }
      if (leadFields.honeypot) return;
      submitLead({ leadForm, formElements, leadFields, leadPayload: buildLeadPayload(leadFields) });
    });
  };
  leadForms.forEach(bindLeadForm);

})();
