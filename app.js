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
        utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign') || null
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
})();
