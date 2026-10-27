/* ============================================
   PRM MONTAGE — Formulär (hero, kontakt, jour, ortssidor)
   Alla formulär med klassen .nt-ajax-form skickas till /api/contact
   Stödjer valfria filbilagor via ett input[type=file] (se form-utils.js)
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {
  var forms = document.querySelectorAll('.nt-ajax-form');
  if (!forms.length) return;

  forms.forEach(function (form) {
    if (window.PRMForm && window.PRMForm.applyAutofill) window.PRMForm.applyAutofill(form);
    var messageBox = form.querySelector('.nt-form-message');
    var submitBtn = form.querySelector('button[type="submit"]');
    var fileInput = form.querySelector('input[type="file"]');
    var originalBtnText = submitBtn ? submitBtn.innerHTML : '';

    function showMessage(text, isError) {
      if (!messageBox) return;
      messageBox.textContent = text;
      messageBox.style.display = 'block';
      messageBox.style.background = isError ? '#fdecea' : '#e7f7ef';
      messageBox.style.color = isError ? '#b3261e' : '#0f6b3c';
    }

    // Egen validering med meddelanden under fälten i stället för webbläsarens bubblor.
    form.setAttribute('novalidate', '');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (messageBox) messageBox.style.display = 'none';
      window.PRMForm.clearFieldErrors(form);
      var invalid = window.PRMForm.validate(form);
      if (invalid) {
        showMessage('Kontrollera de markerade fälten.', true);
        invalid.focus();
        return;
      }

      var formData = new FormData(form);
      if (fileInput && fileInput.name) formData.delete(fileInput.name);
      var data = Object.fromEntries(formData.entries());
      data.type = form.getAttribute('data-form-type') || 'contact';
      data.page = location.pathname;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Skickar...';
      }

      window.PRMForm.readAttachments(fileInput)
        .then(function (attachments) {
          data.attachments = attachments;
          return fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
        })
        .then(window.PRMForm.parseResponse)
        .then(function () {
          if (window.ntTrack) window.ntTrack('generate_lead', { form_type: data.type, service: data.service || '' });
          // Byt ut formuläret mot en bekräftelse så det är tydligt att förfrågan gick iväg.
          if (messageBox) messageBox.style.display = 'none';
          var panel = document.createElement('div');
          panel.innerHTML = window.PRMForm.successHtml(data.email);
          form.parentNode.replaceChild(panel, form);
          panel.scrollIntoView({ block: 'center', behavior: 'smooth' });
          panel.firstChild.focus({ preventScroll: true });
        })
        .catch(function (err) {
          var bad = err.fields && window.PRMForm.showServerErrors(form, err.fields);
          showMessage(err.message || 'Kunde inte skicka meddelandet. Försök igen eller ring oss direkt.', true);
          if (bad) bad.focus();
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
          }
        });
    });
  });
});
