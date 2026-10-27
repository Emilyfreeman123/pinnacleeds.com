  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');
  if (form && window.fetch) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var send = form.querySelector('button[type="submit"]');
      send.disabled = true;
      status.className = 'status';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error();
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
