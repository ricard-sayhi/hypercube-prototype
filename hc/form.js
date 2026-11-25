/* Contact form helpers (Over Hypercube / About Hypercube, Contact tab).
   - E-mail: a dropdown of common endings under the field (anna@gmail.com, anna@hotmail.com, ...). It opens once you
     type, narrows as you type after the @, and works with the mouse, touch and keyboard (arrows, Enter, Escape).
   - Versturen: the prototype cannot send (Turnstile only runs on hypercube.nl), so after checking the required
     fields it says so and offers the same message as an e-mail to info@hypercube.nl. */
(function () {
  'use strict';
  const form = document.getElementById('gform_1');
  if (!form) return;
  const EN = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const T = EN ? {
    endings: 'Suggested e-mail addresses',
    note: 'This is a prototype: messages are not sent from here.', mail: 'Send it as an e-mail instead', subject: 'Message via hypercube.nl',
    fill: 'Please fill in this field.', badMail: 'Please enter a valid e-mail address.',
  } : {
    endings: 'Voorgestelde e-mailadressen',
    note: 'Dit is een prototype: berichten worden hier niet verzonden.', mail: 'Verstuur het als e-mail', subject: 'Bericht via hypercube.nl',
    fill: 'Vul dit veld in.', badMail: 'Vul een geldig e-mailadres in.',
  };
  const mk = (tag, props) => Object.assign(document.createElement(tag), props || {});

  /* ---------- e-mail: dropdown of common endings ---------- */
  const email = document.getElementById('input_1_4');
  if (email) {
    const DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com', 'live.nl', 'icloud.com', 'ziggo.nl', 'kpnmail.nl', 'yahoo.com'];
    const box = email.closest('.ginput_container') || email.parentElement;
    box.classList.add('hc-combo');
    const list = mk('ul', { className: 'hc-suggest', id: 'hc-email-suggest', hidden: true });
    list.setAttribute('role', 'listbox'); list.setAttribute('aria-label', T.endings);
    box.append(list);
    email.setAttribute('role', 'combobox'); email.setAttribute('aria-autocomplete', 'list');
    email.setAttribute('aria-controls', list.id); email.setAttribute('aria-expanded', 'false');
    email.spellcheck = false; email.autocapitalize = 'off';

    let options = [], active = -1;
    const close = () => { list.hidden = true; email.setAttribute('aria-expanded', 'false'); email.removeAttribute('aria-activedescendant'); active = -1; };
    const highlight = i => {
      active = i;
      options.forEach((o, j) => o.el.setAttribute('aria-selected', String(j === i)));
      if (i >= 0) { email.setAttribute('aria-activedescendant', options[i].el.id); options[i].el.scrollIntoView({ block: 'nearest' }); }
      else email.removeAttribute('aria-activedescendant');
    };
    const choose = i => {
      email.value = options[i].value; close();
      email.dispatchEvent(new Event('input', { bubbles: true })); email.dispatchEvent(new Event('change', { bubbles: true }));
      close();
    };
    function update() {
      const v = email.value.trim(), at = v.indexOf('@');
      const local = at < 0 ? v : v.slice(0, at), typed = at < 0 ? '' : v.slice(at + 1).toLowerCase();
      const matches = !local || /\s/.test(local) ? [] : DOMAINS.filter(d => d.startsWith(typed) && d !== typed);
      list.replaceChildren(); options = [];
      if (!matches.length || document.activeElement !== email) { close(); return; }
      matches.forEach((d, i) => {
        const el = mk('li', { id: 'hc-email-opt-' + i, className: 'hc-opt' });
        el.setAttribute('role', 'option'); el.setAttribute('aria-selected', 'false');
        el.append(mk('span', { className: 'hc-opt-local', textContent: local }), mk('span', { className: 'hc-opt-domain', textContent: '@' + d }));
        el.addEventListener('mousedown', e => e.preventDefault());          // keep focus (and the keyboard) in the field
        el.addEventListener('click', () => choose(i));
        el.addEventListener('mousemove', () => active !== i && highlight(i));
        list.append(el); options.push({ el, value: local + '@' + d });
      });
      list.hidden = false; email.setAttribute('aria-expanded', 'true'); highlight(-1);
    }
    email.addEventListener('input', update);
    email.addEventListener('focus', update);
    email.addEventListener('blur', close);
    email.addEventListener('keydown', e => {
      if (list.hidden) { if (e.key === 'ArrowDown') { update(); if (!list.hidden) { highlight(0); e.preventDefault(); } } return; }
      if (e.key === 'ArrowDown') { highlight((active + 1) % options.length); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { highlight(active <= 0 ? options.length - 1 : active - 1); e.preventDefault(); }
      else if (e.key === 'Enter' && active >= 0) { choose(active); e.preventDefault(); }
      else if (e.key === 'Escape') { close(); e.preventDefault(); }
      else if (e.key === 'Tab' && active >= 0) choose(active);
    });
  }

  /* ---------- Versturen: check, then say it cannot be sent from the prototype ---------- */
  const footer = form.querySelector('.gform_footer'), button = form.querySelector('#gform_submit_button_1');
  if (footer && button) {
    const note = mk('p', { className: 'hc-form-note', hidden: true }); note.setAttribute('role', 'status');
    footer.prepend(note);
    const value = sel => { const e = form.querySelector(sel); return e ? e.value.trim() : ''; };
    document.addEventListener('click', e => {
      if (!e.target.closest || e.target.closest('#gform_submit_button_1') !== button) return;
      e.preventDefault(); e.stopPropagation();                                 // Gravity Forms would post to a page that does not exist here
      const fields = [...form.querySelectorAll('input[aria-required="true"], textarea[aria-required="true"], #input_1_4')];
      for (const f of fields) {
        if (f.getAttribute('aria-required') === 'true' && !f.value.trim()) f.setCustomValidity(T.fill);
        else if (f.id === 'input_1_4') f.setCustomValidity(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.value.trim()) ? '' : T.badMail);
        else f.setCustomValidity('');
        if (!f.checkValidity()) {
          // bring the field (with its label) into view below the fixed header, then show the browser's message
          const head = (document.getElementById('header-outer') || {}).offsetHeight || 0, box = f.closest('.gfield') || f;
          window.scrollTo({ top: scrollY + box.getBoundingClientRect().top - head - 24, behavior: 'auto' });
          f.focus({ preventScroll: true }); f.reportValidity();
          f.addEventListener('input', () => f.setCustomValidity(''), { once: true });
          return;
        }
      }
      const interests = [...form.querySelectorAll('#field_1_6 input:checked')].map(i => i.value).join(', ');
      const body = [`${value('#input_1_1')} ${value('#input_1_3')}`, value('#input_1_4'), value('#input_1_5'), interests, '', value('#input_1_7')].filter((l, i) => l || i === 4).join('\n');
      const href = `mailto:info@hypercube.nl?subject=${encodeURIComponent(T.subject)}&body=${encodeURIComponent(body)}`;
      note.replaceChildren(T.note + ' ', mk('a', { href, textContent: T.mail }), '.');
      note.hidden = false;
    }, true);
  }
})();
