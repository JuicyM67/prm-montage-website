/* ============================================
   PRM MONTAGE — Hire Modal (modal.js)
   Öppnas via .hire-btn på alla sidor
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {

  const overlay = document.getElementById('nt-hire-modal');
  if (!overlay) return;

  // Öppna modal via alla knappar med class hire-btn
  document.querySelectorAll('.hire-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  // Stäng via close-knapp
  const closeBtn = overlay.querySelector('.nt-modal__close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  // Stäng via klick utanför modal
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });

  // Stäng via Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Delar upp formuläret i två steg utan att ändra markupen på varje sida:
  // steg 1 = namn, telefon, tjänst. Steg 2 = adress, e-post, beskrivning, bilder.
  // Alla fält behålls (adress är fortsatt obligatorisk), bara ordningen/synligheten ändras.
  function setupTwoSteps(form) {
    const nameInput = form.querySelector('[name="name"]');
    const phoneInput = form.querySelector('[name="phone"]');
    const serviceInput = form.querySelector('[name="service"]');
    const submitBtn = form.querySelector('.nt-submit-btn');
    if (!nameInput || !phoneInput || !serviceInput || !submitBtn) return;

    const nameRow = nameInput.closest('.row-2col');
    const serviceGroup = serviceInput.closest('.form-group');
    if (!nameRow || !serviceGroup || nameRow.contains(serviceInput)) return;

    const step2 = document.createElement('div');
    step2.className = 'nt-step2';
    step2.style.display = 'none';
    Array.from(form.children).forEach(function (child) {
      if (child !== nameRow && child !== serviceGroup && child !== submitBtn) step2.appendChild(child);
    });

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'nt-submit-btn';
    nextBtn.textContent = 'Fortsätt →';

    const hint = document.createElement('p');
    hint.className = 'nt-step-hint';
    hint.style.cssText = 'margin:10px 0 0;font-size:.85rem;color:#63706D;text-align:center;';
    hint.textContent = 'Steg 1 av 2 — det tar under en minut';

    form.insertBefore(step2, submitBtn);
    form.insertBefore(nextBtn, step2);
    form.insertBefore(hint, submitBtn);
    submitBtn.style.display = 'none';

    function goToStep2() {
      const step1Fields = [nameInput, phoneInput, serviceInput];
      for (let i = 0; i < step1Fields.length; i++) {
        if (!step1Fields[i].checkValidity()) {
          step1Fields[i].reportValidity();
          return;
        }
      }
      nextBtn.style.display = 'none';
      step2.style.display = '';
      submitBtn.style.display = '';
      hint.textContent = 'Steg 2 av 2 — nästan klart';
      if (window.ntTrack) window.ntTrack('form_step1', { form_type: 'hire', service: serviceInput.value });
      const address = form.querySelector('[name="address"]');
      if (address) address.focus();
    }

    nextBtn.addEventListener('click', goToStep2);

    // Enter i steg 1 ska gå vidare till steg 2, inte försöka skicka formuläret
    // (de dolda obligatoriska fälten skulle annars blockera det utan felmeddelande).
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && step2.style.display === 'none' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        goToStep2();
      }
    });
  }

  // Formulär submit — skickas via /api/contact (Resend)
  const form = overlay.querySelector('#hire-form');
  if (form) {
    setupTwoSteps(form);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const submitBtn = form.querySelector('.nt-submit-btn');
      const originalBtnText = submitBtn.textContent;
      submitBtn.textContent = 'Skickar...';
      submitBtn.disabled = true;

      const fileInput = form.querySelector('input[type="file"]');
      const formData = new FormData(form);
      if (fileInput && fileInput.name) formData.delete(fileInput.name);
      const data = Object.fromEntries(formData.entries());
      data.type = 'hire';

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
          if (window.ntTrack) window.ntTrack('generate_lead', { form_type: 'hire', service: data.service || '' });
          form.innerHTML = '<div style="text-align:center;padding:40px 0"><i class="fas fa-check-circle" style="font-size:3rem;color:#1FA968;margin-bottom:16px;display:block"></i><h4 style="color:#1F5C50;font-weight:700">Tack för din förfrågan!</h4><p style="color:#63706D">Vi återkommer så snart vi kan.</p></div>';
        })
        .catch(function (err) {
          submitBtn.textContent = originalBtnText;
          submitBtn.disabled = false;
          alert(err.message || 'Kunde inte skicka förfrågan. Försök igen eller ring oss direkt.');
        });
    });
  }

});
