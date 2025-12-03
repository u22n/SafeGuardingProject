const form = document.getElementById('reportForm');
const formMessage = document.getElementById('formMessage');
if(form){
  // Elements used across handlers
  const otherReasonInputGlobal = document.getElementById('otherReason');
  const otherReasonWrapGlobal = document.getElementById('otherReasonWrap');
  const emailInput = document.getElementById('email');
  const emailSuggestions = document.getElementById('emailSuggestions');
  const phoneInput = document.getElementById('phone');
  const countrySelect = document.getElementById('country');
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
      const pre = val.slice(0, atIndex + 1);
      // update click handlers to fill domain
      emailSuggestions?.querySelectorAll('li').forEach(function(li){
        li.onclick = function(){
          emailInput.value = pre + li.dataset.domain;
          emailSuggestions.classList.add('hidden');
        }
      })
    } else {
      emailSuggestions?.classList.add('hidden');
    }
  })

  // Phone formatting helpers
  function formatIntl(raw, cc){
    const lib = window.libphonenumber || window['libphonenumber-js'];
    let candidate = raw.trim();
    // Prepend cc if local style
    if(!candidate.startsWith('+')){
      const stripped = candidate.replace(/[^\d]/g,'');
      if(stripped.startsWith('0')){
        candidate = cc + stripped.slice(1);
      } else if(stripped.length){
        candidate = cc + stripped;
      }
    }
    try{
      const phone = lib.parsePhoneNumber(candidate);
      if(phone && phone.isValid()){
        return phone.formatInternational();
      }
    }catch(e){/* ignore parse errors */}
    return candidate.replace(/[^+\d]/g,'');
  }
  const ccMap = {GB:'+44',US:'+1',CA:'+1',AU:'+61',NZ:'+64',IE:'+353',FR:'+33',DE:'+49',ES:'+34',IT:'+39'};
  function currentCC(){return ccMap[countrySelect?.value || 'GB']}
  function applyPhoneFormat(){
    if(phoneInput && phoneInput.value){
      phoneInput.value = formatIntl(phoneInput.value, currentCC());
    }
  }
  phoneInput?.addEventListener('blur', applyPhoneFormat);
  countrySelect?.addEventListener('change', applyPhoneFormat);

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
  if(!name || !email || !details){
    formMessage.textContent = 'Please complete all required fields.';
    formMessage.style.color = '#ef4444';
    return
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
    formMessage.textContent = 'Please enter a valid email address.';
    formMessage.style.color = '#ef4444';
    form.email.setAttribute('aria-invalid','true');
    form.email.focus();
    return
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
