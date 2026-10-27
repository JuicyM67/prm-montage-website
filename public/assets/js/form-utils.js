/* ============================================
   PRM MONTAGE — Delad hjälpfunktion för filbilagor
   Används av contact-form.js (.nt-ajax-form) och modal.js (#hire-form)

   Filer laddas upp direkt från webbläsaren till Vercel Blob (se api/blob-upload.js)
   istället för att base64-kodas in i formulärets JSON-body. Det gör att vi kan tillåta
   betydligt större bilagor än Vercels 4,5 MB-gräns för serverless-funktioners request-body
   (som annars slår till fort när base64 lägger på ~33% overhead).
   ============================================ */

function PRMForm_clear(input) {
  input.removeAttribute('aria-invalid');
  input.classList.remove('nt-invalid');
  var anchor = input.closest('.nt-form-field, .form-group') || input.parentNode;
  var err = anchor && anchor.querySelector('.nt-field-error');
  if (err) err.remove();
}

window.PRMForm = {
  MAX_FILES: 3,
  MAX_TOTAL_BYTES: 10 * 1024 * 1024,

  _uploadModulePromise: null,
  _loadUploadFn: function () {
    if (!window.PRMForm._uploadModulePromise) {
      window.PRMForm._uploadModulePromise = import('https://esm.sh/@vercel/blob/client')
        .then(function (mod) { return mod.upload; });
    }
    return window.PRMForm._uploadModulePromise;
  },

  // Sätter standardiserade autocomplete-/inputmode-attribut så att iOS/Android/Chrome kan
  // fylla i namn, telefon, e-post och adress med ett tryck från användarens egna kontaktkort.
  applyAutofill: function (form) {
    var map = {
      name: { autocomplete: 'name', autocapitalize: 'words', enterkeyhint: 'next' },
      phone: { autocomplete: 'tel', inputmode: 'tel', enterkeyhint: 'next' },
      email: { autocomplete: 'email', inputmode: 'email', autocapitalize: 'off', enterkeyhint: 'next' },
      address: { autocomplete: 'address-line1', enterkeyhint: 'next' },
      postalCode: { autocomplete: 'postal-code', inputmode: 'numeric', enterkeyhint: 'next' },
      city: { autocomplete: 'address-level2', enterkeyhint: 'next' },
    };
    Object.keys(map).forEach(function (field) {
      var el = form.querySelector('[name="' + field + '"]');
      if (!el) return;
      Object.keys(map[field]).forEach(function (attr) { el.setAttribute(attr, map[field][attr]); });
    });
  },

  // ---------- Validering (samma regler som validateFields i api/contact.js) ----------

  RULES: {
    name: function (v) { return v.length >= 2 ? '' : 'Fyll i ditt namn.'; },
    phone: function (v) {
      return /^\+?\d{7,15}$/.test(v.replace(/[\s\-().]/g, '')) ? '' : 'Ange ett giltigt telefonnummer, t.ex. 070-123 45 67.';
    },
    email: function (v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 200 ? '' : 'Ange en giltig e-postadress, t.ex. namn@exempel.se.';
    },
    address: function (v) { return v.length >= 3 ? '' : 'Fyll i din adress.'; },
    postalCode: function (v) { return /^\d{5}$/.test(v.replace(/\s/g, '')) ? '' : 'Postnumret ska vara fem siffror, t.ex. 123 45.'; },
    city: function (v) { return v.length >= 2 ? '' : 'Fyll i din stad.'; },
    service: function (v) { return v ? '' : 'Välj vilken tjänst det gäller.'; },
  },

  // Visar ett felmeddelande under fältet och markerar det. Rensas när användaren skriver igen.
  showFieldError: function (input, message) {
    PRMForm_clear(input);
    input.setAttribute('aria-invalid', 'true');
    var err = document.createElement('div');
    err.className = 'nt-field-error';
    err.setAttribute('role', 'alert');
    err.textContent = message;
    var anchor = input.closest('.nt-form-field, .form-group') || input.parentNode;
    anchor.appendChild(err);
    input.classList.add('nt-invalid');
    var clear = function () { PRMForm_clear(input); };
    input.addEventListener('input', clear, { once: true });
    input.addEventListener('change', clear, { once: true });
  },

  clearFieldErrors: function (form) {
    form.querySelectorAll('.nt-invalid').forEach(PRMForm_clear);
  },

  // Validerar fälten (alla, eller bara de i `names`). Returnerar första ogiltiga fältet, annars null.
  validate: function (form, names) {
    var PRMForm = window.PRMForm;
    var first = null;
    Object.keys(PRMForm.RULES).forEach(function (field) {
      if (names && names.indexOf(field) === -1) return;
      var input = form.querySelector('[name="' + field + '"]');
      if (!input || !input.required) return;
      var message = PRMForm.RULES[field](String(input.value || '').trim());
      if (message) {
        PRMForm.showFieldError(input, message);
        if (!first) first = input;
      }
    });
    return first;
  },

  // Visar felen från servern ({ fields: { email: '...' } }). Returnerar första fältet som träffades.
  showServerErrors: function (form, fields) {
    var first = null;
    Object.keys(fields || {}).forEach(function (field) {
      var input = form.querySelector('[name="' + field + '"]');
      if (!input) return;
      window.PRMForm.showFieldError(input, fields[field]);
      if (!first) first = input;
    });
    return first;
  },

  // Kastas av submit-flödet så att vi kan visa fältfel i stället för en allmän ruta.
  parseResponse: function (res) {
    return res.json().then(function (body) {
      if (!res.ok) {
        var err = new Error(body.error || 'Något gick fel.');
        err.fields = body.fields;
        throw err;
      }
      return body;
    });
  },

  successHtml: function (email) {
    var safe = String(email || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
    return '<div class="nt-success" role="status" tabindex="-1">' +
      '<svg viewBox="0 0 52 52" width="72" height="72" aria-hidden="true"><circle cx="26" cy="26" r="24" fill="none" stroke="#1FA968" stroke-width="3"/><path fill="none" stroke="#1FA968" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="M15 27l8 8 14-16"/></svg>' +
      '<h4>Tack för din förfrågan!</h4>' +
      '<p>Vi har tagit emot den och återkommer så snart vi kan.</p>' +
      (safe ? '<p>En bekräftelse är skickad till <strong>' + safe + '</strong>.</p>' : '') +
      '<p class="nt-success__hint">Brådskar det? Ring <a href="tel:+46852027977">08-520 279 77</a></p>' +
      '</div>';
  },

  readAttachments: function (fileInput) {
    var PRMForm = window.PRMForm;
    return new Promise(function (resolve, reject) {
      if (!fileInput || !fileInput.files || !fileInput.files.length) {
        resolve([]);
        return;
      }
      var files = Array.prototype.slice.call(fileInput.files).slice(0, PRMForm.MAX_FILES);
      var totalBytes = files.reduce(function (sum, f) { return sum + f.size; }, 0);
      if (totalBytes > PRMForm.MAX_TOTAL_BYTES) {
        reject(new Error('Bilagorna är för stora (max 10 MB totalt). Ta bort någon fil och försök igen.'));
        return;
      }

      PRMForm._loadUploadFn()
        .then(function (upload) {
          return Promise.all(
            files.map(function (file) {
              return upload(file.name, file, {
                access: 'public',
                handleUploadUrl: '/api/blob-upload',
              }).then(function (blob) {
                return { filename: file.name, url: blob.url };
              });
            })
          );
        })
        .then(resolve)
        .catch(function () {
          reject(new Error('Kunde inte ladda upp bilagorna. Försök igen eller skicka utan bilagor.'));
        });
    });
  },
};
