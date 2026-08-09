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
    const toggleSticky = () => {
      const threshold = Math.max(320, document.documentElement.scrollHeight * 0.18);
      sticky.classList.toggle('visible', window.scrollY > threshold);
    };
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
  interestForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('lead-name')?.value.trim() || '';
    const interest = interestSelect?.value || 'غير محدد';
    const campaign = query.get('utm_campaign') || '';
    const message = [
      'مرحبًا، أريد تفاصيل مشروع عالية الخالدية بالطائف.',
      `نوع الاهتمام: ${interest}`,
      name ? `الاسم: ${name}` : '',
      campaign ? `الحملة: ${campaign}` : ''
    ].filter(Boolean).join('\n');

    emit('whatsapp_prefill_submit', {
      interest_type: interest,
      traffic_intent: trafficIntent || 'default',
      utm_campaign: campaign || null
    });
    window.open(`https://wa.me/966565777177?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  });

})();
