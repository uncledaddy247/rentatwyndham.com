(function () {
  // Mobile menu
  var btn = document.getElementById('menuBtn'), nav = document.getElementById('mainNav');
  if (btn && nav) btn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Request form -> Apps Script web app (emails info@ and logs to the Rental Worksheet)
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbxsp3TacVHaU6R-ZRK3O36PhrWz5_WAHQCXrCvG2TKwEN7smJOviltnSNz8dfV683bh/exec';
  var f = document.getElementById('reqForm');
  if (!f) return;
  // Prefill resort from /booking-request?resort=Name (links from the resort directory)
  try {
    var qp = new URLSearchParams(location.search).get('resort');
    var sel = document.getElementById('resort');
    if (qp && sel) {
      var hit = Array.prototype.find.call(sel.options, function (o) { return o.text.indexOf(qp) === 0; });
      if (hit) { sel.value = hit.value || hit.text; }
      else { var o = document.createElement('option'); o.text = qp; o.value = qp; sel.insertBefore(o, sel.options[1]); sel.value = qp; }
      var h = document.querySelector('.sec-head h2'); if (h) h.textContent = 'Request dates at ' + qp;
    }
  } catch (err) {}
  var started = document.getElementById('started');
  if (started) started.value = String(Date.now());
  var ci = document.getElementById('ci'), co = document.getElementById('co');
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var iso = function (d) { return d.toISOString().slice(0, 10); };
  if (ci) ci.min = iso(today);
  if (ci && co) ci.addEventListener('change', function () {
    if (ci.value) { var d = new Date(ci.value); d.setDate(d.getDate() + 1); co.min = iso(d); if (co.value && co.value <= ci.value) co.value = iso(d); }
  });
  var msg = document.getElementById('formMsg'), okBox = document.getElementById('okBox'), submitBtn = document.getElementById('submitBtn');
  function showErr(t) { msg.textContent = t; msg.hidden = false; }
  f.addEventListener('submit', function (e) {
    e.preventDefault(); msg.hidden = true;
    if (!f.checkValidity()) { f.reportValidity(); return; }
    if (ci.value && co.value && co.value <= ci.value) { showErr('Check-out has to be after check-in.'); co.focus(); return; }
    if (f.website && f.website.value) { return; } // honeypot
    var elapsed = Date.now() - Number(started.value || 0);
    if (elapsed < 3000) { showErr('That was quick. Please take a second look and send again.'); started.value = String(Date.now() - 3000); return; }
    if (!ENDPOINT) {
      showErr('The request form is being connected. Please email info@rentatwyndham.com with your dates and phone number and we will send an invoice right away.');
      return;
    }
    var a1 = f.address_street ? f.address_street.value.trim() : '', a2 = f.address_city_state_zip ? f.address_city_state_zip.value.trim() : '';
    if ((a1 || a2) && f.notes) { f.notes.value = 'Mailing address: ' + [a1, a2].filter(Boolean).join(', ') + (f.notes.value ? '\n' + f.notes.value : ''); }
    var data = new URLSearchParams(new FormData(f));
    data.set('page', location.href);
    data.set('submitted_at', new Date().toISOString());
    submitBtn.disabled = true; submitBtn.textContent = 'Sending...';
    fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: data })
      .then(function () {
        f.hidden = true;
        var aside = document.querySelector('.aside'); if (aside) aside.hidden = true;
        okBox.hidden = false; okBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        try { if (window.gtag) gtag('event', 'generate_lead', { form: 'date_request' }); } catch (err) {}
      })
      .catch(function () {
        submitBtn.disabled = false; submitBtn.textContent = 'Send my request';
        showErr('Something went wrong sending that. Please email info@rentatwyndham.com with your dates and phone number.');
      });
  });
})();
