// Ensure page starts at the top on load/refresh/navigation (covers bfcache/pageshow)
(function ensureStartAtTop(){
  try{
    window.addEventListener('pageshow', function(e){
      if(e.persisted){
        try{ window.scrollTo({top:0,left:0,behavior:'auto'}); }catch(err){}
      }
    });
    window.addEventListener('load', function(){
      // small timeout to override any browser restore
      setTimeout(function(){ try{ window.scrollTo({top:0,left:0,behavior:'auto'}); }catch(err){} }, 0);
    });
    // Attempt to reset scroll before unload so reload starts from top in some browsers
    window.addEventListener('beforeunload', function(){ try{ window.scrollTo(0,0); }catch(err){} });
  }catch(e){/* no-op */}
})();

const form = document.getElementById('reportForm');
const formMessage = document.getElementById('formMessage');
if(form){
  // Elements used across handlers
  const otherReasonInputGlobal = document.getElementById('otherReason');
  const otherReasonWrapGlobal = document.getElementById('otherReasonWrap');
  const emailInput = document.getElementById('email');
  const emailSuggestions = document.getElementById('emailSuggestions');
  const phoneInput = document.getElementById('phone');
  const evidenceInput = document.getElementById('evidence');
  const dropzone = document.getElementById('evidenceDropzone');
  const dzChooseBtn = document.getElementById('dzChooseBtn');
  const dzClearBtn = document.getElementById('dzClearBtn');
  const dzLabel = document.getElementById('dzLabel');
  const dzProgress = document.getElementById('dzProgress');
  const dzProgressBar = document.getElementById('dzProgressBar');
  const detailsEl = document.getElementById('details');
  const detailsCounter = document.getElementById('detailsCounter');
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
      // (reverted) ARIA listbox role changes
      const pre = val.slice(0, atIndex + 1);
      // update click handlers to fill domain
      emailSuggestions?.querySelectorAll('li').forEach(function(li){
        // (reverted) option roles and tabindex
        li.onclick = function(){
          emailInput.value = pre + li.dataset.domain;
          emailSuggestions.classList.add('hidden');
          emailInput.focus();
        }
      })
      // set first item selected by default for keyboard nav
      // (reverted) initial aria-selected handling
      // (reverted) do not lock body scroll
    } else {
      emailSuggestions?.classList.add('hidden');
      // (reverted) no body scroll unlock needed
    }
  })

  // Keyboard controls for email suggestions
  emailInput?.addEventListener('keydown', function(ev){
    if(emailSuggestions?.classList.contains('hidden')) return;
    const items = Array.from(emailSuggestions.querySelectorAll('li'));
    if(items.length === 0) return;
    let index = -1;
    if(ev.key === 'ArrowDown'){
      ev.preventDefault();
      index = Math.min(items.length - 1, index + 1);
      items[index].focus();
      items[index].scrollIntoView({block:'nearest'});
    }else if(ev.key === 'ArrowUp'){
      ev.preventDefault();
      index = Math.max(0, index - 1);
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

  // Dropzone behaviors
  function preventDefaults(e){ e.preventDefault(); e.stopPropagation(); }
  if(dropzone){
    ['dragenter','dragover','dragleave','drop'].forEach(function(evt){ dropzone.addEventListener(evt, preventDefaults, false); });
    dropzone.addEventListener('dragover', function(){ dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', function(){ dropzone.classList.remove('dragover'); });
    dropzone.addEventListener('drop', function(ev){
      dropzone.classList.remove('dragover');
      const dt = ev.dataTransfer;
      if(dt && dt.files && dt.files.length){
        handleFileSelection(dt.files[0]);
        // set the file onto the hidden input so form submit picks it up
        try{ evidenceInput.files = dt.files; }catch(err){}
      }
    });
  }
  if(dzChooseBtn && evidenceInput){ dzChooseBtn.addEventListener('click', function(){ evidenceInput.click() }); }
  if(evidenceInput){
    evidenceInput.addEventListener('change', function(){ if(evidenceInput.files && evidenceInput.files[0]){ handleFileSelection(evidenceInput.files[0]); } });
  }
  if(dzClearBtn){ dzClearBtn.addEventListener('click', function(){ if(evidenceInput){ evidenceInput.value = ''; dzLabel.textContent = 'Choose a file or drag & drop here'; dzClearBtn.classList.add('hidden'); dzProgress.classList.add('hidden'); dzProgressBar.style.width = '0%'; } }); }

  function handleFileSelection(file){
    if(!file) return;
    const maxBytes = 5 * 1024 * 1024;
    const okTypes = ['image/jpeg','image/png','application/pdf'];
    if(file.size > maxBytes){ formMessage.textContent = 'Attachment too large (max 5MB).'; formMessage.style.color = '#ef4444'; return; }
    if(!okTypes.includes(file.type)){ formMessage.textContent = 'Unsupported file type. Use JPG, PNG, or PDF.'; formMessage.style.color = '#ef4444'; return; }
    // Update label and show remove
    dzLabel.textContent = file.name;
    dzClearBtn?.classList.remove('hidden');
    // Show progress and read file to provide a progress indicator
    if(dzProgress){ dzProgress.classList.remove('hidden'); dzProgress.setAttribute('aria-hidden','false'); dzProgressBar.style.width = '4%'; dzProgressBar.setAttribute('aria-valuenow','4'); }
    try{
      const reader = new FileReader();
      reader.onprogress = function(e){ if(e.lengthComputable && dzProgressBar){ const pct = Math.round((e.loaded / e.total) * 100); dzProgressBar.style.width = pct + '%'; dzProgressBar.setAttribute('aria-valuenow', String(pct)); } };
      reader.onload = function(){ if(dzProgressBar){ dzProgressBar.style.width = '100%'; dzProgressBar.setAttribute('aria-valuenow','100'); setTimeout(function(){ if(dzProgress) dzProgress.classList.add('hidden'); }, 600); }
      };
      reader.onerror = function(){ formMessage.textContent = 'Error reading file.'; formMessage.style.color = '#ef4444'; };
      // Start reading (this triggers onprogress for larger files)
      reader.readAsArrayBuffer(file);
    }catch(e){ /* ignore */ }
  }

  // Details live character counter
  if(detailsEl && detailsCounter){
    function updateDetailsCounter(){ const len = detailsEl.value.length; detailsCounter.textContent = `${len} character${len===1?'':'s'}`; if(len>0){ detailsCounter.classList.add('visible'); } else { detailsCounter.classList.remove('visible'); } }
    detailsEl.addEventListener('input', updateDetailsCounter);
    // initialize
    updateDetailsCounter();
  }

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
