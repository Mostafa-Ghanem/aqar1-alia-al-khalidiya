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

  const TALLY_FORM_ID = 'ja4eJ4';
  const tallyFrames = document.querySelectorAll('[data-tally-lead-form] iframe[data-tally-src]');
  tallyFrames.forEach((tallyFrame) => {
    try {
      const tallyUrl = new URL(tallyFrame.dataset.tallySrc);
      if (!tallyUrl.searchParams.has('intent')) tallyUrl.searchParams.set('intent', trafficIntent || 'default');
      tallyFrame.dataset.tallySrc = tallyUrl.toString();
    } catch (_) {}
  });

  window.addEventListener('message', (event) => {
    if (event.origin !== 'https://tally.so' || typeof event.data !== 'string' || !event.data.includes('Tally.')) return;
    let tallyEvent;
    try { tallyEvent = JSON.parse(event.data); } catch (_) { return; }
    const payload = tallyEvent?.payload || {};
    if (payload.formId !== TALLY_FORM_ID) return;

    if (event.data.includes('Tally.FormLoaded')) {
      emit('lead_form_view', { form_id: TALLY_FORM_ID, provider: 'tally' });
    }
    if (event.data.includes('Tally.FormSubmitted')) {
      emit('generate_lead', {
        lead_id: payload.id || null,
        form_id: TALLY_FORM_ID,
        provider: 'tally',
        landing_intent: trafficIntent || 'default',
        source: queryValue('utm_source') || (queryValue('gclid') || queryValue('gbraid') || queryValue('wbraid') ? 'google' : 'direct'),
        medium: queryValue('utm_medium') || (queryValue('gclid') || queryValue('gbraid') || queryValue('wbraid') ? 'cpc' : ''),
        campaign: queryValue('utm_campaign') || null,
        keyword: queryValue('utm_term') || null
      });
    }
  });

})();
