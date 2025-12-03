const form = document.getElementById('reportForm');
const formMessage = document.getElementById('formMessage');
// Always start at top on refresh/load
window.addEventListener('load', function(){
  window.scrollTo({top: 0, left: 0, behavior: 'auto'});
});
if(form){
  // Elements used across handlers
  const otherReasonInputGlobal = document.getElementById('otherReason');
  const otherReasonWrapGlobal = document.getElementById('otherReasonWrap');
  const emailInput = document.getElementById('email');
  const emailSuggestions = document.getElementById('emailSuggestions');
  const phoneInput = document.getElementById('phone');
  // Show/hide Other reason field immediately on change (before submit)
  form.topic?.addEventListener('change', function(){
    if(form.topic.value === 'Other'){
      otherReasonWrapGlobal?.classList.remove('hidden');
      otherReasonInputGlobal?.focus();
    } else {
      otherReasonWrapGlobal?.classList.add('hidden');
      if(otherReasonInputGlobal){otherReasonInputGlobal.value = ''}
    }
  })
  // Initialize visibility on load (in case browser restores values)
  if(form.topic && form.topic.value === 'Other'){
    otherReasonWrapGlobal?.classList.remove('hidden');
  } else {
    otherReasonWrapGlobal?.classList.add('hidden');
  }

  // Email domain suggestions: show after '@'
  emailInput?.addEventListener('input', function(){
    const val = emailInput.value;
    const atIndex = val.indexOf('@');
    if(atIndex !== -1){
      emailSuggestions?.classList.remove('hidden');
      emailSuggestions?.setAttribute('role','listbox');
      const pre = val.slice(0, atIndex + 1);
      // update click handlers to fill domain
      emailSuggestions?.querySelectorAll('li').forEach(function(li){
        li.setAttribute('role','option');
        li.setAttribute('tabindex','-1');
        li.onclick = function(){
          emailInput.value = pre + li.dataset.domain;
          emailSuggestions.classList.add('hidden');
          emailInput.focus();
        }
      })
      // set first item selected by default for keyboard nav
      const first = emailSuggestions.querySelector('li');
      if(first){
        emailSuggestions.querySelectorAll('li').forEach(i=>i.removeAttribute('aria-selected'));
        first.setAttribute('aria-selected','true');
      }
    } else {
      emailSuggestions?.classList.add('hidden');
    }
  })

  // Keyboard controls for email suggestions
  emailInput?.addEventListener('keydown', function(ev){
    if(!emailSuggestions || emailSuggestions.classList.contains('hidden')) return;
    const items = Array.from(emailSuggestions.querySelectorAll('li'));
    if(items.length === 0) return;
    const active = emailSuggestions.querySelector('li[aria-selected="true"]');
    let index = active ? items.indexOf(active) : -1;
    if(ev.key === 'ArrowDown'){
      ev.preventDefault();
      index = Math.min(items.length - 1, index + 1);
      items.forEach(i => i.removeAttribute('aria-selected'));
      items[index].setAttribute('aria-selected','true');
      items[index].focus();
      items[index].scrollIntoView({block:'nearest'});
    }else if(ev.key === 'ArrowUp'){
      ev.preventDefault();
      index = Math.max(0, index - 1);
      items.forEach(i => i.removeAttribute('aria-selected'));
      items[index].setAttribute('aria-selected','true');
      items[index].focus();
      items[index].scrollIntoView({block:'nearest'});
    }else if(ev.key === 'Enter'){
      if(index >= 0){
        const domain = items[index].dataset.domain;
        const val = emailInput.value;
        const atIndex = val.indexOf('@');
        const pre = val.slice(0, atIndex + 1);
        emailInput.value = pre + domain;
        emailSuggestions.classList.add('hidden');
        ev.preventDefault();
        emailInput.focus();
      }
    }else if(ev.key === 'Escape'){
      emailSuggestions.classList.add('hidden');
    }
  });

  // Phone formatting helpers
  function formatIntl(raw){
    const lib = window.libphonenumber || window['libphonenumber-js'];
    let candidate = raw.trim();
    // Determine a sensible default country from browser locale
    const locale = (navigator.language || navigator.userLanguage || 'en-GB').toUpperCase();
    const localeCountryMap = {
      'EN-GB':'GB','EN-US':'US','EN-CA':'CA','EN-AU':'AU','EN-NZ':'NZ','EN-IE':'IE',
      'FR-FR':'FR','DE-DE':'DE','ES-ES':'ES','IT-IT':'IT'
    };
    const defaultCountry = localeCountryMap[locale] || 'GB';
    try{
      if(candidate.startsWith('+')){
        const phone = lib.parsePhoneNumber(candidate);
        if(phone && phone.isValid()){
          return phone.formatInternational();
        }
      } else {
        // Attempt parsing using a defaultCountry for local numbers
        const stripped = candidate.replace(/[^\d]/g,'');
        const phone = lib.parsePhoneNumberFromString(stripped, defaultCountry);
        if(phone && phone.isValid()){
          return phone.formatInternational();
        }
      }
    }catch(e){/* ignore parse errors */}
    return candidate.replace(/[^+\d]/g,'');
  }
  function applyPhoneFormat(){
    if(phoneInput && phoneInput.value){
      phoneInput.value = formatIntl(phoneInput.value);
    }
  }
  phoneInput?.addEventListener('blur', applyPhoneFormat);

form.addEventListener('submit', function(e){
  e.preventDefault();
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const topic = form.topic?.value || '';
  const otherReasonInput = document.getElementById('otherReason');
  const otherReasonWrap = document.getElementById('otherReasonWrap');
  const details = form.details.value.trim();
  const evidence = document.getElementById('evidence');
  const confirmCopy = document.getElementById('confirmCopy');
  // Auto-format phone: normalize and apply country code if local style
  const country = document.getElementById('country');
  if(form.phone && form.phone.value){
    const raw = form.phone.value.trim();
    let normalized = raw.replace(/[^+\d]/g,'');
    const ccMap = {GB:'+44',US:'+1',CA:'+1',AU:'+61',NZ:'+64',IE:'+353',FR:'+33',DE:'+49',ES:'+34',IT:'+39'};
    const cc = ccMap[country?.value || 'GB'];
    if(normalized.startsWith('+')){
      // already international, leave as-is
    } else if(normalized.startsWith('0')){
      normalized = cc + normalized.slice(1);
    } else {
      normalized = cc + normalized;
    }
    form.phone.value = normalized;
  }
  
  form.name.setAttribute('aria-invalid','false');
  form.email.setAttribute('aria-invalid','false');
  // Inline field-level errors: clear previous
  document.querySelectorAll('.field-error').forEach(function(el){el.remove()});
  function showError(inputEl, message){
    const p = document.createElement('p');
    p.className = 'field-error mt-1 text-xs text-red-500';
    p.textContent = message;
    inputEl.setAttribute('aria-invalid','true');
    inputEl.after(p);
  }
  let hasError = false;
  if(!name){ showError(form.name, 'Name is required.'); hasError = true; }
  if(!email){ showError(form.email, 'Email is required.'); hasError = true; }
  if(!details){ showError(form.details, 'Details are required.'); hasError = true; }
  if(hasError){
    formMessage.textContent = 'Please fix the errors and try again.';
    formMessage.style.color = '#ef4444';
    return;
  }
  if(!topic){
    formMessage.textContent = 'Please select a topic.';
    formMessage.style.color = '#ef4444';
    form.topic.setAttribute('aria-invalid','true');
    form.topic.focus();
    return
  }
  if(topic === 'Other'){
    if(otherReasonWrap){otherReasonWrap.classList.remove('hidden')}
    const reason = otherReasonInput?.value.trim() || '';
    if(!reason){
      formMessage.textContent = 'Please provide a reason for Other.';
      formMessage.style.color = '#ef4444';
      otherReasonInput?.setAttribute('aria-invalid','true');
      otherReasonInput?.focus();
      return
    }
  } else {
    if(otherReasonWrap){otherReasonWrap.classList.add('hidden')}
  }

  // Evidence validation: optional, but if present validate type and size
  if(evidence && evidence.files && evidence.files[0]){
    const file = evidence.files[0];
    const maxBytes = 5 * 1024 * 1024; // 5MB
    const okTypes = ['image/jpeg','image/png','application/pdf'];
    if(file.size > maxBytes){
      formMessage.textContent = 'Attachment too large (max 5MB).';
      formMessage.style.color = '#ef4444';
      evidence.setAttribute('aria-invalid','true');
      evidence.focus();
      return
    }
    if(!okTypes.includes(file.type)){
      formMessage.textContent = 'Unsupported file type. Use JPG, PNG, or PDF.';
      formMessage.style.color = '#ef4444';
      evidence.setAttribute('aria-invalid','true');
      evidence.focus();
      return
    }
  }

  // live toggle handled above (outside submit)
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if(!emailPattern.test(email)){
    showError(form.email, 'Enter a valid email (e.g., name@example.com).');
    formMessage.textContent = 'Please fix the errors and try again.';
    formMessage.style.color = '#ef4444';
    form.email.focus();
    return;
  }
  formMessage.textContent = '';
  const modal = document.getElementById('thankYouModal');
  const closeBtn = document.getElementById('closeModal');
  const previousActive = document.activeElement;
  if(modal){
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
    if(closeBtn){closeBtn.focus()}
    // Optionally note confirmation email toggle (no actual sending here)
    if(confirmCopy && confirmCopy.checked){
      // In a real app we would trigger an email here
    }
    function closeHandler(){
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden','true');
      closeBtn.removeEventListener('click', closeHandler);
      document.removeEventListener('keydown', escHandler);
      if(previousActive){previousActive.focus()}
    }
    function escHandler(ev){if(ev.key==='Escape'){closeHandler()}}
    closeBtn.addEventListener('click', closeHandler);
    document.addEventListener('keydown', escHandler);
    modal.querySelector('[data-modal-overlay]')?.addEventListener('click', closeHandler);
  }
  form.reset();
})
}

  const yearEl = document.getElementById('year');
  if(yearEl){yearEl.textContent = new Date().getFullYear()}

/* Dark mode removed: no theme toggle logic */

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const primaryNav = document.getElementById('primaryNav');
if(navToggle && primaryNav){
  navToggle.addEventListener('click', function(){
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    if(primaryNav.classList.contains('hidden')){
      primaryNav.classList.remove('hidden');
      navToggle.setAttribute('aria-label','Close navigation');
    }else{
      primaryNav.classList.add('hidden');
      navToggle.setAttribute('aria-label','Open navigation');
    }
  })
}

// Regional contacts filter
const regionFilter = document.getElementById('regionFilter');
const regionalGrid = document.getElementById('regionalGrid');
const regionSearch = document.getElementById('regionSearch');
if(regionFilter && regionalGrid){
  regionFilter.addEventListener('change', function(){
    const val = regionFilter.value;
    regionalGrid.querySelectorAll('[data-region]').forEach(function(card){
      const region = card.getAttribute('data-region');
      const show = (val === 'all' || val === region);
      card.classList.toggle('hidden', !show);
    });
  });
}

// Name search filter (combined with region filter)
if(regionSearch && regionalGrid){
  function applyCombinedFilter(){
    const selectVal = regionFilter ? regionFilter.value : 'all';
    const q = regionSearch.value.trim().toLowerCase();
    regionalGrid.querySelectorAll('[data-region]').forEach(function(card){
      const region = card.getAttribute('data-region');
      const name = (card.getAttribute('data-name') || '').toLowerCase();
      const matchesRegion = (selectVal === 'all' || selectVal === region);
      const matchesQuery = (!q || name.includes(q));
      card.classList.toggle('hidden', !(matchesRegion && matchesQuery));
    });
  }
  regionSearch.addEventListener('input', applyCombinedFilter);
  if(regionFilter){regionFilter.addEventListener('change', applyCombinedFilter)}
}

// FAQ accordion
document.querySelectorAll('.faq-toggle').forEach(function(btn){
  btn.addEventListener('click', function(){
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    if(panel){
      panel.classList.toggle('hidden');
    }
  })
})
