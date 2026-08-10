(() => {
  'use strict';

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const emit = (name, params = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...params });
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
  };

  document.querySelectorAll('[data-event]').forEach((element) => {
    element.addEventListener('click', () => {
      emit(element.dataset.event, {
        link_url: element.href || null,
        link_text: element.textContent.trim(),
        page_path: window.location.pathname,
        utm_source: new URLSearchParams(window.location.search).get('utm_source') || null,
        utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign') || null,
        utm_medium: new URLSearchParams(window.location.search).get('utm_medium') || null,
        utm_term: new URLSearchParams(window.location.search).get('utm_term') || null,
        traffic_intent: new URLSearchParams(window.location.search).get('intent') || 'default'
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


  const query = new URLSearchParams(window.location.search);
  const trafficIntent = (query.get('intent') || '').toLowerCase();
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
  const presetInterest = {
    residential: 'سكني',
    commercial: 'تجاري',
    investment: 'استثماري / متعدد الاستخدامات'
  }[trafficIntent];
  if (interestSelect && presetInterest) interestSelect.value = presetInterest;

  document.querySelectorAll('[data-set-interest]').forEach((button) => {
    button.addEventListener('click', () => {
      if (interestSelect) interestSelect.value = button.dataset.setInterest;
      emit('interest_select', {
        interest_type: button.dataset.setInterest,
        traffic_intent: trafficIntent || 'default'
      });
      document.getElementById('enquiry-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => interestSelect?.focus({ preventScroll: true }), 450);
    });
  });

  const interestForm = document.getElementById('interest-form');
  const formStatus = document.querySelector('[data-form-status]');
  const successBox = document.querySelector('[data-lead-success]');
  const submitButton = document.querySelector('[data-lead-submit]');

  const cleanPhone = (value) => value.replace(/[^0-9+]/g, '');
  const isSaudiPhone = (value) => /^(?:\+?966|00966|0)?5\d{8}$/.test(cleanPhone(value));
  const qp = (key) => query.get(key) || '';

  interestForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    formStatus?.classList.remove('error', 'success');
    if (formStatus) formStatus.textContent = '';

    const name = document.getElementById('lead-name')?.value.trim() || '';
    const phone = document.getElementById('lead-phone')?.value.trim() || '';
    const email = document.getElementById('lead-email')?.value.trim() || '';
    const interest = interestSelect?.value || '';
    const preferredContact = document.getElementById('lead-contact')?.value || 'أي طريقة';
    const message = document.getElementById('lead-message')?.value.trim() || '';
    const honeypot = document.getElementById('lead-company')?.value || '';
    const consent = Boolean(document.getElementById('lead-consent')?.checked);

    if (!name || !phone || !interest || !consent) {
      if (formStatus) { formStatus.textContent = 'أكمل الاسم والجوال ونوع الاهتمام والموافقة على التواصل.'; formStatus.classList.add('error'); }
      return;
    }
    if (!isSaudiPhone(phone)) {
      if (formStatus) { formStatus.textContent = 'تحقق من رقم الجوال السعودي، مثال: 05xxxxxxxx.'; formStatus.classList.add('error'); }
      document.getElementById('lead-phone')?.focus();
      return;
    }
    if (honeypot) return;

    const payload = {
      name, phone: cleanPhone(phone), email, interest,
      preferred_contact: preferredContact, message, company: honeypot, consent,
      source: qp('utm_source') || (qp('gclid') || qp('gbraid') || qp('wbraid') ? 'google' : 'direct'),
      medium: qp('utm_medium') || (qp('gclid') || qp('gbraid') || qp('wbraid') ? 'cpc' : ''),
      campaign: qp('utm_campaign'),
      ad_group: qp('utm_adgroup') || qp('adgroupid'),
      keyword: qp('utm_term'),
      match_type: qp('matchtype'),
      device: qp('device'),
      landing_intent: trafficIntent || 'default',
      gclid: qp('gclid'), gbraid: qp('gbraid'), wbraid: qp('wbraid'),
      page_url: window.location.href,
      referrer: document.referrer || ''
    };

    if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'جارٍ إرسال الطلب…'; }
    if (formStatus) formStatus.textContent = 'جارٍ تسجيل طلبك…';

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || 'submit_failed');

      emit('generate_lead', {
        lead_id: result.lead_id || null,
        interest_type: interest,
        preferred_contact: preferredContact,
        traffic_intent: trafficIntent || 'default',
        source: payload.source || null,
        medium: payload.medium || null,
        campaign: payload.campaign || null,
        ad_group: payload.ad_group || null,
        keyword: payload.keyword || null
      });

      interestForm.hidden = true;
      if (successBox) successBox.hidden = false;
      if (formStatus) { formStatus.textContent = ''; formStatus.classList.add('success'); }
    } catch (error) {
      emit('lead_submit_error', { traffic_intent: trafficIntent || 'default', error_type: String(error?.message || 'submit_failed').slice(0, 80) });
      if (formStatus) {
        formStatus.textContent = 'تعذر تسجيل الطلب الآن. يمكنك المحاولة مرة أخرى أو التواصل معنا مباشرة عبر الرقم الموحد.';
        formStatus.classList.add('error');
      }
    } finally {
      if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'اطلب تفاصيل المشروع'; }
    }
  });

})();
