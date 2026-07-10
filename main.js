/* ============================================================
   Forakis Refrigeration & Air Conditioning — site behavior
   ============================================================ */
(function () {
  'use strict';

  /* --------------------------------------------------------
     FORM DELIVERY — via Formspree (vanilla AJAX integration).
     Requests are emailed to the address configured in the
     Formspree dashboard (vgfhvac@gmail.com). Submissions are
     POSTed as JSON with an Accept: application/json header,
     per https://help.formspree.io/hc/en-us/articles/360013470814
     While empty, submissions are simulated locally.
     -------------------------------------------------------- */
  var FORM_ENDPOINT = 'https://formspree.io/f/xkoldorj';

  var form = document.getElementById('request-form');
  var confirmCard = document.getElementById('confirm-card');
  var submitBtn = document.getElementById('submit-btn');
  var detailsLabel = document.getElementById('details-label');
  var detailsInput = document.getElementById('f-details');
  var formError = document.getElementById('form-error');
  var mobileMQ = window.matchMedia('(max-width: 899px)');

  var COPY = {
    Install: {
      detailsLabel: 'What are you looking to install or replace?',
      placeholderDesktop: 'e.g. Replace a 20-year-old central AC unit; add mini-splits to a second floor; new walk-in cooler…',
      placeholderMobile: 'e.g. Replace a 20-year-old central AC unit; add mini-splits to a second floor…',
      submitLabel: 'Get my free estimate',
      confirmTitle: 'Estimate request received'
    },
    Service: {
      detailsLabel: "What's the problem?",
      placeholderDesktop: 'e.g. AC running but not cooling; strange noise from the furnace; walk-in cooler not holding temp…',
      placeholderMobile: 'e.g. AC running but not cooling; strange noise from the furnace…',
      submitLabel: 'Send service request',
      confirmTitle: 'Service request received'
    }
  };

  /* ---------- analytics hooks (no-ops until gtag exists) ---------- */
  function track(eventName, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params || {});
    }
  }
  document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
    a.addEventListener('click', function () {
      track('phone_call_click', { link_location: a.closest('footer') ? 'footer' : a.closest('.nav') ? 'nav' : 'body' });
    });
  });

  /* ---------- helpers ---------- */
  function getRequestType() {
    var checked = form.querySelector('input[name="requestType"]:checked');
    return checked ? checked.value : 'Install';
  }

  function syncToggleClasses(radio) {
    form.querySelectorAll('input[name="' + radio.name + '"]').forEach(function (input) {
      input.closest('.toggle').classList.toggle('is-selected', input.checked);
    });
  }

  function applyAdaptiveCopy() {
    var c = COPY[getRequestType()];
    detailsLabel.textContent = c.detailsLabel;
    detailsInput.placeholder = mobileMQ.matches ? c.placeholderMobile : c.placeholderDesktop;
    submitBtn.textContent = c.submitLabel;
  }

  /* ---------- toggle groups (radios styled as segmented controls) ---------- */
  form.querySelectorAll('.toggle input[type="radio"]').forEach(function (input) {
    input.addEventListener('change', function () {
      syncToggleClasses(input);
      if (input.name === 'requestType') applyAdaptiveCopy();
    });
  });

  var mqHandler = function () { applyAdaptiveCopy(); };
  if (mobileMQ.addEventListener) mobileMQ.addEventListener('change', mqHandler);
  else mobileMQ.addListener(mqHandler); /* older Safari */

  /* ---------- CTA pre-selection + reset of sent state ---------- */
  document.querySelectorAll('[data-request-type]').forEach(function (el) {
    el.addEventListener('click', function () {
      var type = el.getAttribute('data-request-type');
      var radio = form.querySelector('input[name="requestType"][value="' + type + '"]');
      if (radio) {
        radio.checked = true;
        syncToggleClasses(radio);
        applyAdaptiveCopy();
      }
      /* make the form usable again if a request was already sent */
      form.hidden = false;
      confirmCard.hidden = true;
      formError.hidden = true;
      /* let the default anchor navigation run — CSS smooth-scrolls
         to #request with scroll-margin-top for the sticky nav */
    });
  });

  /* ---------- date input: no past dates ---------- */
  var dateInput = document.getElementById('f-date');
  var today = new Date();
  dateInput.min = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');

  /* ---------- validation ---------- */
  function setInvalid(input, errEl, invalid) {
    input.classList.toggle('is-invalid', invalid);
    input.setAttribute('aria-invalid', invalid ? 'true' : 'false');
    errEl.hidden = !invalid;
  }

  function validate() {
    var name = document.getElementById('f-name');
    var phone = document.getElementById('f-phone');
    var email = document.getElementById('f-email');
    var firstInvalid = null;

    var nameBad = name.value.trim() === '';
    setInvalid(name, document.getElementById('err-name'), nameBad);
    if (nameBad && !firstInvalid) firstInvalid = name;

    var digits = phone.value.replace(/\D/g, '');
    var phoneBad = digits.length < 7 || digits.length > 15;
    setInvalid(phone, document.getElementById('err-phone'), phoneBad);
    if (phoneBad && !firstInvalid) firstInvalid = phone;

    var emailVal = email.value.trim();
    var emailBad = emailVal !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
    setInvalid(email, document.getElementById('err-email'), emailBad);
    if (emailBad && !firstInvalid) firstInvalid = email;

    var detailsBad = detailsInput.value.trim() === '';
    setInvalid(detailsInput, document.getElementById('err-details'), detailsBad);
    if (detailsBad && !firstInvalid) firstInvalid = detailsInput;

    if (firstInvalid) {
      firstInvalid.focus();
      return false;
    }
    return true;
  }

  /* clear a field's error as soon as the user fixes it */
  [['f-name', 'err-name'], ['f-phone', 'err-phone'], ['f-email', 'err-email'], ['f-details', 'err-details']].forEach(function (pair) {
    var input = document.getElementById(pair[0]);
    var err = document.getElementById(pair[1]);
    input.addEventListener('input', function () { setInvalid(input, err, false); });
  });

  /* ---------- submission ---------- */
  function deliver(data) {
    if (!FORM_ENDPOINT) {
      console.warn('[Forakis] FORM_ENDPOINT is not set — submission simulated. Set it in main.js before launch.');
      return new Promise(function (resolve) { setTimeout(resolve, 350); });
    }
    /* human-readable keys — these become the rows of the email Bill receives */
    var payload = {
      'Request type': data.requestType === 'Install' ? 'Install estimate (FREE)' : 'Service visit',
      'Name': data.name,
      'Phone': data.phone,
      'Property type': data.propertyType,
      'Address': data.address || '—',
      'Details': data.details,
      'Preferred date': data.date || 'No preference',
      'Preferred time': data.slot || 'No preference',
      '_subject': 'Website request: ' + data.requestType + ' — ' + data.name
    };
    /* Formspree validates any field named "email" as an address,
       so it is only included when the customer provided one */
    if (data.email) {
      payload['Email'] = data.email;
      payload._replyto = data.email;
    }
    return fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
    });
  }

  function showConfirmation(data) {
    var c = COPY[data.requestType];
    document.getElementById('confirm-title').textContent = c.confirmTitle;

    var nameSuffix = '';
    if (data.name) nameSuffix = ', ' + data.name.trim().split(' ')[0];
    document.getElementById('confirm-name').textContent = nameSuffix;

    var slotSuffix = '';
    if (data.slot) {
      slotSuffix = ' — you asked for ' + data.slot.toLowerCase();
      if (data.date) {
        var parts = data.date.split('-');
        var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        slotSuffix += ' on ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    }
    document.getElementById('confirm-slot').textContent = slotSuffix;

    form.hidden = true;
    confirmCard.hidden = false;
    confirmCard.focus({ preventScroll: true });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    formError.hidden = true;

    /* honeypot: bots fill it — pretend success, send nothing */
    var honeypot = form.querySelector('input[name="website"]');

    if (!validate()) return;

    var slotChecked = form.querySelector('input[name="slot"]:checked');
    var propChecked = form.querySelector('input[name="propertyType"]:checked');
    var data = {
      name: document.getElementById('f-name').value.trim(),
      phone: document.getElementById('f-phone').value.trim(),
      email: document.getElementById('f-email').value.trim(),
      address: document.getElementById('f-address').value.trim(),
      propertyType: propChecked ? propChecked.value : 'Residential',
      requestType: getRequestType(),
      details: detailsInput.value.trim(),
      date: dateInput.value,
      slot: slotChecked ? slotChecked.value : ''
    };

    if (honeypot && honeypot.value !== '') {
      showConfirmation(data);
      return;
    }

    var originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    deliver(data).then(function () {
      track('generate_lead', { request_type: data.requestType, property_type: data.propertyType });
      showConfirmation(data);
    }).catch(function () {
      formError.hidden = false;
    }).finally(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    });
  });

  /* initial state */
  applyAdaptiveCopy();
})();
