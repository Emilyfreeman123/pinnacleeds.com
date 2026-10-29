  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');
  if (form && window.fetch) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.elements._honey.value) return; /* bot filled the hidden field */
      var send = form.querySelector('button[type="submit"]');
      var v = function (n) { return (form.elements[n].value || '').trim(); };
      var org = v('Organization'), type = v('Organization type');
      /* Fixed field order = the row order of the table in the email */
      var data = {
        _subject: 'New inquiry: ' + v('Name') + (org ? ' (' + org + ')' : '') + ' | ' + type + ' | Pinnacle EDS',
        _template: 'table',
        _captcha: 'false',
        Name: v('Name'),
        email: v('email'),
        Organization: org || '-',
        'Organization type': type,
        Country: v('Country') || '-',
        Message: v('Message'),
        Language: form.getAttribute('data-lang-name'),
        Page: location.href.split('#')[0]
      };
      send.disabled = true;
      status.className = 'status';
      fetch(form.getAttribute('data-ajax'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok || String(j.success) !== 'true') throw new Error(j.message); }); })
        .then(function () {
          form.reset();
          status.textContent = {{f_ok_js}};
          status.className = 'status show';
        })
        .catch(function () {
          status.textContent = {{f_err_js}};
          status.className = 'status show err';
        })
        .then(function () { send.disabled = false; });
    });
  }
