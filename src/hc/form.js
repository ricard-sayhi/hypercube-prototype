/* Contact form helpers (Over Hypercube / About Hypercube, Contact tab).
   - E-mail: one-tap endings (@gmail.com, @hotmail.com, ...). Typing after the @ narrows the list.
   - Phone: Mobiel / Vast switch for Dutch numbers; the number is grouped as you type (06 1234 5678, 010 123 4567,
     0570 123 456) and a square fills when it has all 10 digits. +31 / 0031 are turned into 0.
   - Versturen: the prototype cannot send (Turnstile only runs on hypercube.nl), so after checking the required
     fields it says so and offers the same message as an e-mail to info@hypercube.nl. */
(function () {
  'use strict';
  const form = document.getElementById('gform_1');
  if (!form) return;
  const EN = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const T = EN ? {
    endings: 'E-mail endings', type: 'Number type', mobile: 'Mobile', landline: 'Landline',
    hintMobile: '06 + 8 digits', hintLand: 'Area code + number: 10 digits', left: n => `${n} more digit${n === 1 ? '' : 's'}`, done: 'Complete',
    note: 'This is a prototype: messages are not sent from here.', mail: 'Send it as an e-mail instead', subject: 'Message via hypercube.nl',
    tooLong: 'A Dutch number has 10 digits.',
  } : {
    endings: 'E-mailadres aanvullen', type: 'Soort nummer', mobile: 'Mobiel', landline: 'Vast',
    hintMobile: '06 + 8 cijfers', hintLand: 'Netnummer + nummer: 10 cijfers', left: n => `nog ${n} cijfer${n === 1 ? '' : 's'}`, done: 'Compleet',
    note: 'Dit is een prototype: berichten worden hier niet verzonden.', mail: 'Verstuur het als e-mail', subject: 'Bericht via hypercube.nl',
    tooLong: 'Een Nederlands nummer heeft 10 cijfers.',
  };
  const mk = (tag, props, kids) => { const e = document.createElement(tag); Object.assign(e, props || {}); (kids || []).forEach(k => e.append(k)); return e; };

  /* ---------- e-mail endings ---------- */
  const email = document.getElementById('input_1_4');
  if (email) {
    // a text field with the e-mail keyboard: e-mail fields refuse a scripted caret position (needed to put it before the @);
    // the address is checked on Versturen
    email.type = 'text'; email.inputMode = 'email'; email.autocomplete = 'email'; email.spellcheck = false; email.autocapitalize = 'off';
    const DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com', 'live.nl', 'icloud.com', 'ziggo.nl', 'kpnmail.nl', 'yahoo.com'];
    const list = mk('div', { className: 'hc-fill', role: 'group' }); list.setAttribute('aria-label', T.endings);
    const chips = DOMAINS.map(d => {
      const b = mk('button', { type: 'button', className: 'hc-chip', textContent: '@' + d }); b.dataset.d = d; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('mousedown', e => e.preventDefault());           // keep the caret in the field
      b.addEventListener('click', () => {
        const local = email.value.split('@')[0].trim();
        email.value = local + '@' + d;
        email.focus();
        const at = local ? email.value.length : 0;                         // nothing typed yet: caret before the @
        email.setSelectionRange(at, at);
        sync(); email.dispatchEvent(new Event('input', { bubbles: true })); email.dispatchEvent(new Event('change', { bubbles: true }));
      });
      list.append(b); return b;
    });
    function sync() {
      const v = email.value.trim().toLowerCase(), i = v.indexOf('@'), typed = i < 0 ? '' : v.slice(i + 1);
      let shown = 0;
      chips.forEach(b => {
        const d = b.dataset.d, exact = typed === d, show = !typed || d.startsWith(typed);
        b.hidden = !show; b.setAttribute('aria-pressed', String(exact)); if (show) shown++;
      });
      list.hidden = shown === 0;                                            // their own domain: nothing to offer
    }
    email.addEventListener('input', sync);
    email.closest('.ginput_container').after(list);
    sync();
  }

  /* ---------- Dutch phone number ---------- */
  const phone = document.getElementById('input_1_5');
  if (phone) {
    phone.type = 'tel'; phone.inputMode = 'tel'; phone.autocomplete = 'tel-national';
    // 3-digit area codes (incl. 0); every other landline area code has 4 digits
    const AREA3 = ['010', '013', '015', '020', '023', '024', '026', '030', '033', '035', '036', '038', '040', '043', '045', '046', '050', '053', '055', '058', '070', '071', '072', '073', '074', '075', '076', '077', '078', '079'];
    let mode = 'mobile';
    const field = phone.closest('.gfield'), label = field.querySelector('label');
    const seg = mk('div', { className: 'hc-seg', role: 'group' }); seg.setAttribute('aria-label', T.type);
    const btns = { mobile: mk('button', { type: 'button', textContent: T.mobile }), landline: mk('button', { type: 'button', textContent: T.landline }) };
    Object.entries(btns).forEach(([m, b]) => { b.dataset.m = m; b.addEventListener('click', () => setMode(m, true)); seg.append(b); });
    const row = mk('div', { className: 'hc-label-row' }); label.before(row); row.append(label, seg);
    const hint = mk('p', { className: 'hc-hint', id: 'hc-phone-hint' }); hint.setAttribute('aria-live', 'polite');
    phone.closest('.ginput_container').after(hint);
    phone.setAttribute('aria-describedby', 'hc-phone-hint');

    const digitsOf = v => {
      let d = v.replace(/[^\d+]/g, '');
      d = d.replace(/^\+31/, '0').replace(/^0031/, '0').replace(/\+/g, '');
      if (d && d[0] !== '0') d = '0' + d;                                    // every Dutch number starts with 0
      return d.slice(0, 10);
    };
    const group = d => {
      if (d.startsWith('06')) return [d.slice(0, 2), d.slice(2, 6), d.slice(6)];
      const a = AREA3.some(c => d.startsWith(c)) || d.length < 4 && AREA3.some(c => c.startsWith(d)) ? 3 : 4;
      return a === 3 ? [d.slice(0, 3), d.slice(3, 6), d.slice(6)] : [d.slice(0, 4), d.slice(4, 7), d.slice(7)];
    };
    function format() {
      const before = phone.value, caret = phone.selectionStart ?? before.length;
      const digitsBeforeCaret = digitsOf(before.slice(0, caret)).length;
      const d = digitsOf(before);
      if (d.length >= 2) { const isMobile = d.startsWith('06'); if ((mode === 'mobile') !== isMobile) setMode(isMobile ? 'mobile' : 'landline', false); }
      const out = group(d).filter(Boolean).join(' ');
      if (out !== before) {
        phone.value = out;
        let pos = 0, seen = 0; while (pos < out.length && seen < digitsBeforeCaret) { if (/\d/.test(out[pos])) seen++; pos++; }
        if (document.activeElement === phone) phone.setSelectionRange(pos, pos);
      }
      const n = d.length;
      hint.classList.toggle('ok', n === 10);
      hint.textContent = n === 0 ? (mode === 'mobile' ? T.hintMobile : T.hintLand) : n === 10 ? T.done : T.left(10 - n);
      phone.setCustomValidity(n && n < 10 ? (mode === 'mobile' ? T.hintMobile : T.hintLand) : '');
    }
    function setMode(m, fromUser) {
      mode = m;
      Object.entries(btns).forEach(([k, b]) => b.setAttribute('aria-pressed', String(k === m)));
      phone.placeholder = m === 'mobile' ? '06 1234 5678' : '010 123 4567';
      if (fromUser) {
        const d = digitsOf(phone.value);
        if (m === 'mobile' && !d.startsWith('06')) phone.value = '06 ' ;
        if (m === 'landline' && (!d || d.startsWith('06'))) phone.value = '0';
        phone.focus(); const e = phone.value.length; phone.setSelectionRange(e, e);
        format();
      }
    }
    phone.addEventListener('focus', () => { if (!phone.value && mode === 'mobile') { phone.value = '06 '; requestAnimationFrame(() => phone.setSelectionRange(3, 3)); format(); } });
    phone.addEventListener('blur', () => { if (/^0?6?$/.test(digitsOf(phone.value))) { phone.value = ''; format(); } });
    phone.addEventListener('input', format);
    setMode('mobile', false); format();
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
      const required = [...form.querySelectorAll('input[aria-required="true"], textarea[aria-required="true"], #input_1_4, #input_1_5')];
      for (const f of required) {
        if (f.getAttribute('aria-required') === 'true' && !f.value.trim()) f.setCustomValidity(EN ? 'Please fill in this field.' : 'Vul dit veld in.');
        else if (f.id === 'input_1_4') f.setCustomValidity(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.value.trim()) ? '' : (EN ? 'Please enter a valid e-mail address.' : 'Vul een geldig e-mailadres in.'));
        else if (f.id !== 'input_1_5') f.setCustomValidity('');
        if (!f.checkValidity()) {
          // bring the field (with its label) into view below the fixed header, then show the browser's message
          const head = (document.getElementById('header-outer') || {}).offsetHeight || 0, box = f.closest('.gfield') || f;
          window.scrollTo({ top: scrollY + box.getBoundingClientRect().top - head - 24, behavior: 'auto' });
          f.focus({ preventScroll: true }); f.reportValidity();
          f.addEventListener('input', () => f.id !== 'input_1_5' && f.setCustomValidity(''), { once: true }); return;
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
