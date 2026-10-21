/* ============================================
   PRM MONTAGE — Offert-sheet (modal.js)
   Öppnas via .hire-btn på alla sidor (inkl. "Begär offert" i mobilraden).
   Mobil (< 768 px): bottom sheet som glider upp och stängs genom att dra ner.
   Desktop: samma formulär som centrerad modal.
   Två steg: 1) tjänst, namn, telefon  2) adress m.m. (adress är obligatorisk).
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {

  const overlay = document.getElementById('nt-hire-modal');
  if (!overlay) return;
  const sheet = overlay.querySelector('.nt-modal');
  const form = overlay.querySelector('#hire-form');

  const mobileQuery = window.matchMedia('(max-width: 767px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let closing = false;

  function isMobile() { return mobileQuery.matches; }
  function haptic(pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
  }
  function track(name, params) {
    if (window.ntTrack) window.ntTrack(name, params);
  }

  // ---------- Öppna / stäng ----------

  function openModal(source) {
    closing = false;
    overlay.classList.remove('nt-closing');
    overlay.style.removeProperty('--nt-drag');
    sheet.style.transform = '';
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    track('cta_click', { cta: 'open_quote', source: source });
  }

  function finishClose() {
    overlay.classList.remove('active', 'nt-closing');
    overlay.style.removeProperty('--nt-drag');
    sheet.classList.remove('nt-dragging');
    sheet.style.transform = '';
    document.body.style.overflow = '';
    closing = false;
  }

  function closeModal() {
    if (!overlay.classList.contains('active') || closing) return;
    if (isMobile() && !reduceMotion) {
      closing = true;
      overlay.classList.add('nt-closing');
      sheet.style.transform = 'translateY(100%)';
      setTimeout(finishClose, 260);
    } else {
      finishClose();
    }
  }

  document.querySelectorAll('.hire-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      openModal(btn.closest('.nt-mobile-cta-bar') ? 'mobile_bar' : 'page_button');
    });
  });

  const closeBtn = overlay.querySelector('.nt-modal__close');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  // ---------- Dra ner för att stänga (bara mobil) ----------

  function setupSheetGestures() {
    let startY = 0, dy = 0, startT = 0, tracking = false, dragging = false;

    sheet.addEventListener('touchstart', function (e) {
      if (!isMobile() || closing || e.touches.length !== 1) return;
      const t = e.target;
      const fromGrip = t.closest('.nt-sheet-handle, .nt-sheet-head');
      const interactive = t.closest('input, textarea, select, button, label, a');
      // Dra från handtaget/rubriken alltid; annars bara om sheeten är scrollad längst upp.
      if (!fromGrip && (sheet.scrollTop > 0 || interactive)) return;
      tracking = true;
      dragging = false;
      dy = 0;
      startY = e.touches[0].clientY;
      startT = Date.now();
    }, { passive: true });

    sheet.addEventListener('touchmove', function (e) {
      if (!tracking) return;
      dy = e.touches[0].clientY - startY;
      if (!dragging) {
        if (sheet.scrollTop > 0 || dy < 0) { tracking = false; return; }
        if (dy > 6) {
          dragging = true;
          sheet.classList.add('nt-dragging');
        } else {
          return;
        }
      }
      e.preventDefault();
      const offset = Math.max(dy, 0);
      sheet.style.transform = 'translateY(' + offset + 'px)';
      overlay.style.setProperty('--nt-drag', Math.min(offset / Math.max(sheet.offsetHeight, 1), 1));
    }, { passive: false });

    function release(cancelled) {
      if (!tracking) return;
      tracking = false;
      if (!dragging) return;
      dragging = false;
      sheet.classList.remove('nt-dragging');
      const velocity = dy / Math.max(Date.now() - startT, 1);
      if (!cancelled && (dy > 110 || velocity > 0.6)) {
        haptic(8);
        closeModal();
      } else {
        sheet.style.transform = '';
        overlay.style.removeProperty('--nt-drag');
      }
    }
    sheet.addEventListener('touchend', function () { release(false); });
    sheet.addEventListener('touchcancel', function () { release(true); });
  }

  // ---------- Formulär: chips, steg, autofyll ----------

  const EMOJI = {
    'Köksrenovering': '🍳',
    'Bygg & renovering': '🧱',
    'VVS & Badrum': '🚿',
    'Elektriker': '⚡',
    'Altanbygge': '🏡',
    'Jour / akut': '🚨',
    'Annat': '✨',
  };

  // Gör om <select name="service"> till tryckbara kort. Selecten finns kvar (dold)
  // så att formulärdata och validering fungerar precis som förut.
  function buildServiceChips(serviceInput, onPick) {
    const group = document.createElement('div');
    group.className = 'nt-chips';
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-label', 'Vilken tjänst gäller det?');

    Array.from(serviceInput.options).forEach(function (opt) {
      if (!opt.value) return;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'nt-chip';
      chip.setAttribute('role', 'radio');
      chip.dataset.value = opt.value;
      chip.innerHTML = '<span class="nt-chip__emoji" aria-hidden="true">' + (EMOJI[opt.value] || '🔧') + '</span><span></span>';
      chip.lastChild.textContent = opt.textContent;
      chip.addEventListener('click', function () {
        serviceInput.value = opt.value;
        serviceInput.dispatchEvent(new Event('change', { bubbles: true }));
        sync();
        haptic(10);
        group.classList.remove('nt-chips--error');
        if (onPick) onPick(opt.value);
      });
      group.appendChild(chip);
    });

    function sync() {
      group.querySelectorAll('.nt-chip').forEach(function (c) {
        c.setAttribute('aria-checked', c.dataset.value === serviceInput.value ? 'true' : 'false');
      });
    }
    sync();

    serviceInput.classList.add('nt-select-hidden');
    serviceInput.setAttribute('tabindex', '-1');
    serviceInput.parentNode.insertBefore(group, serviceInput);
    return group;
  }

  function setupSteps() {
    const nameInput = form.querySelector('[name="name"]');
    const phoneInput = form.querySelector('[name="phone"]');
    const serviceInput = form.querySelector('[name="service"]');
    const submitBtn = form.querySelector('.nt-submit-btn');
    if (!nameInput || !phoneInput || !serviceInput || !submitBtn) return;

    const nameRow = nameInput.closest('.row-2col');
    const serviceGroup = serviceInput.closest('.form-group');
    if (!nameRow || !serviceGroup || nameRow.contains(serviceInput)) return;

    if (window.PRMForm && window.PRMForm.applyAutofill) window.PRMForm.applyAutofill(form);

    // Steg 2 = allt utom tjänst, namn/telefon och skicka-knappen.
    const step2 = document.createElement('div');
    step2.className = 'nt-step2';
    step2.style.display = 'none';
    Array.from(form.children).forEach(function (child) {
      if (child !== nameRow && child !== serviceGroup && child !== submitBtn) step2.appendChild(child);
    });

    // Tjänst först (ett tryck), sedan namn och telefon.
    form.insertBefore(serviceGroup, form.firstChild);

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'nt-submit-btn';
    nextBtn.textContent = 'Fortsätt →';

    const hint = document.createElement('p');
    hint.className = 'nt-step-hint';
    hint.textContent = 'Steg 1 av 2 — det tar under en minut';

    const progress = document.createElement('div');
    progress.className = 'nt-progress';
    progress.innerHTML = '<span></span>';
    progress.style.setProperty('--p', '50%');
    form.parentNode.insertBefore(progress, form);

    form.insertBefore(step2, submitBtn);
    form.insertBefore(nextBtn, step2);
    form.insertBefore(hint, submitBtn);
    submitBtn.style.display = 'none';

    const chips = buildServiceChips(serviceInput, function () {
      if (!nameInput.value) setTimeout(function () { nameInput.focus({ preventScroll: false }); }, 120);
    });

    function goToStep2() {
      if (!serviceInput.value) {
        chips.classList.remove('nt-chips--error');
        void chips.offsetWidth; // starta om animationen
        chips.classList.add('nt-chips--error');
        haptic([30, 40, 30]);
        chips.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }
      const fields = [nameInput, phoneInput];
      for (let i = 0; i < fields.length; i++) {
        if (!fields[i].checkValidity()) {
          fields[i].reportValidity();
          return;
        }
      }
      nextBtn.style.display = 'none';
      step2.style.display = '';
      step2.classList.add('nt-step2--in');
      submitBtn.style.display = '';
      progress.style.setProperty('--p', '100%');
      hint.textContent = 'Steg 2 av 2 — nästan klart 🎉';
      haptic(12);
      track('form_step1', { form_type: 'hire', service: serviceInput.value });
      const address = form.querySelector('[name="address"]');
      if (address) address.focus();
    }

    nextBtn.addEventListener('click', goToStep2);

    // Enter i steg 1 ska gå vidare, inte försöka skicka formuläret
    // (de dolda obligatoriska fälten skulle annars blockera det utan felmeddelande).
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && step2.style.display === 'none' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        goToStep2();
      }
    });
  }

  function showSuccess() {
    const progress = overlay.querySelector('.nt-progress');
    if (progress) progress.remove();
    const sub = overlay.querySelector('.subtitle');
    if (sub) sub.style.display = 'none';
    form.innerHTML =
      '<div class="nt-success">' +
        '<svg viewBox="0 0 52 52" width="72" height="72" aria-hidden="true"><circle cx="26" cy="26" r="24" fill="none" stroke="#1FA968" stroke-width="3"/><path fill="none" stroke="#1FA968" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="M15 27l8 8 14-16"/></svg>' +
        '<h4>Tack för din förfrågan!</h4>' +
        '<p>Vi återkommer så snart vi kan.</p>' +
        '<p class="nt-success__hint">Brådskar det? Ring <a href="tel:+46852027977">08-520 279 77</a></p>' +
      '</div>';
    haptic([15, 50, 15]);
  }

  // ---------- Init ----------

  if (sheet) {
    const handle = document.createElement('div');
    handle.className = 'nt-sheet-handle';
    handle.setAttribute('aria-hidden', 'true');
    sheet.insertBefore(handle, sheet.firstChild);
    sheet.querySelectorAll('h3, p.subtitle').forEach(function (el) { el.classList.add('nt-sheet-head'); });
    setupSheetGestures();
  }

  if (form) {
    setupSteps();

    // Formulär submit — skickas via /api/contact (Resend)
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const submitBtn = form.querySelector('.nt-submit-btn:not([style*="display: none"])') || form.querySelector('.nt-submit-btn');
      const originalBtnText = submitBtn.textContent;
      submitBtn.textContent = 'Skickar...';
      submitBtn.disabled = true;

      const fileInput = form.querySelector('input[type="file"]');
      const formData = new FormData(form);
      if (fileInput && fileInput.name) formData.delete(fileInput.name);
      const data = Object.fromEntries(formData.entries());
      data.type = 'hire';
      data.page = location.pathname;

      window.PRMForm.readAttachments(fileInput)
        .then(function (attachments) {
          data.attachments = attachments;
          return fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
        })
        .then(function (res) {
          return res.json().then(function (body) {
            if (!res.ok) throw new Error(body.error || 'Något gick fel.');
            return body;
          });
        })
        .then(function () {
          track('generate_lead', { form_type: 'hire', service: data.service || '' });
          showSuccess();
        })
        .catch(function (err) {
          submitBtn.textContent = originalBtnText;
          submitBtn.disabled = false;
          alert(err.message || 'Kunde inte skicka förfrågan. Försök igen eller ring oss direkt.');
        });
    });
  }

});
