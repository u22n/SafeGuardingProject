// Ensure page starts at the top on load/refresh
if('scrollRestoration' in history){history.scrollRestoration='manual';}
window.scrollTo(0,0);

window.addEventListener('DOMContentLoaded', function(){
  window.scrollTo(0,0);
});

window.addEventListener('pageshow', function(e){
  window.scrollTo(0,0);
});

const form = document.getElementById('reportForm');
const formMessage = document.getElementById('formMessage');
if(form){
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
  form.topic?.addEventListener('change', function(){
    if(form.topic.value === 'Other'){
      otherReasonWrapGlobal?.classList.remove('hidden');
      otherReasonInputGlobal?.focus();
    } else {
      otherReasonWrapGlobal?.classList.add('hidden');
      if(otherReasonInputGlobal){otherReasonInputGlobal.value = ''}
    }
  })
  if(form.topic && form.topic.value === 'Other'){
    otherReasonWrapGlobal?.classList.remove('hidden');
  } else {
    otherReasonWrapGlobal?.classList.add('hidden');
  }

  emailInput?.addEventListener('input', function(){
    const val = emailInput.value;
    const atIndex = val.indexOf('@');
    if(atIndex !== -1){
      emailSuggestions?.classList.remove('hidden');
      const pre = val.slice(0, atIndex + 1);
      emailSuggestions?.querySelectorAll('li').forEach(function(li){
        li.onclick = function(){
          emailInput.value = pre + li.dataset.domain;
          try{ validateEmail(); }catch(e){}
          emailSuggestions.classList.add('hidden');
          emailInput.focus();
        }
      })
      const domainPart = val.slice(atIndex + 1).toLowerCase();
      if(domainPart){
        const match = Array.from(emailSuggestions.querySelectorAll('li')).some(function(li){
          return li.dataset.domain && li.dataset.domain.toLowerCase() === domainPart;
        });
        if(match){
          emailSuggestions.classList.add('hidden');
          try{ validateEmail(); }catch(e){}
        }
      }
    } else {
      emailSuggestions?.classList.add('hidden');
    }
  })

  emailInput?.addEventListener('keydown', function(ev){
    if(emailSuggestions?.classList.contains('hidden')) return;
    const items = Array.from(emailSuggestions.querySelectorAll('li'));
    if(items.length === 0) return;
    const currentIndex = items.findIndex(i => i === document.activeElement);
    if(ev.key === 'ArrowDown'){
      ev.preventDefault();
      const next = (currentIndex === -1) ? 0 : Math.min(items.length - 1, currentIndex + 1);
      items[next].focus();
      items[next].scrollIntoView({block:'nearest'});
    } else if(ev.key === 'ArrowUp'){
      ev.preventDefault();
      const prev = (currentIndex === -1) ? items.length - 1 : Math.max(0, currentIndex - 1);
      items[prev].focus();
      items[prev].scrollIntoView({block:'nearest'});
    } else if(ev.key === 'Enter'){
      const focused = items.find(i => i === document.activeElement);
      if(focused){
        ev.preventDefault();
        const domain = focused.dataset.domain;
        const val = emailInput.value;
        const atIndex = val.indexOf('@');
        const pre = val.slice(0, atIndex + 1);
        emailInput.value = pre + domain;
        emailSuggestions.classList.add('hidden');
        emailInput.focus();
      }
    } else if(ev.key === 'Escape'){
      emailSuggestions.classList.add('hidden');
    }
  });

  function formatIntl(raw){
    const lib = window.libphonenumber || window['libphonenumber-js'];
    let candidate = raw.trim();
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
        const stripped = candidate.replace(/[^\d]/g,'');
        const phone = lib.parsePhoneNumberFromString(stripped, defaultCountry);
        if(phone && phone.isValid()){
          return phone.formatInternational();
        }
      }
    }catch(e){/* ignore parse errors */}
    return candidate.replace(/[^+\d]/g,'');
  }
  let _phoneLibLoading = false;
  function loadPhoneLib(){
    return new Promise(function(resolve, reject){
      if(window.libphonenumber || window['libphonenumber-js']){ resolve(true); return; }
      if(_phoneLibLoading){
        const t = setInterval(function(){ if(window.libphonenumber || window['libphonenumber-js']){ clearInterval(t); resolve(true); } }, 100);
        return;
      }
      _phoneLibLoading = true;
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/libphonenumber-js@1.11.9/bundle/libphonenumber-js.min.js';
      s.async = true;
      s.onload = function(){ _phoneLibLoading = false; resolve(true); };
      s.onerror = function(){ _phoneLibLoading = false; reject(new Error('lib load failed')); };
      document.head.appendChild(s);
    });
  }
  function applyPhoneFormat(){
    if(!phoneInput) return;
    if(!phoneInput.value) return;
    const libPresent = (window.libphonenumber || window['libphonenumber-js']);
    if(!libPresent){
      loadPhoneLib().then(function(){ try{ phoneInput.value = formatIntl(phoneInput.value); }catch(e){} }).catch(function(){});
      return;
    }
    try{ phoneInput.value = formatIntl(phoneInput.value); }catch(e){}
  }
  phoneInput?.addEventListener('blur', applyPhoneFormat);
  phoneInput?.addEventListener('focus', function(){ loadPhoneLib().catch(()=>{}); });
  phoneInput?.addEventListener('input', function(){ if(phoneInput.value.length>3) loadPhoneLib().catch(()=>{}); });

  const toastEl = document.getElementById('toast');
  function showToast(msg, type){
    if(!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    toastEl.classList.add('show');
    if(type === 'error') toastEl.style.background = '#b91c1c'; else toastEl.style.background = '#111827';
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function(){ toastEl.classList.remove('show'); toastEl.classList.add('hidden'); }, 3500);
  }

  function resetFormUI(){
    if(formMessage){ formMessage.textContent = ''; formMessage.style.color = ''; }
    document.querySelectorAll('.field-error').forEach(function(el){ el.remove(); });
    document.querySelectorAll('.field-valid').forEach(function(icon){ icon.classList.remove('visible','error'); });
    ['name','email','phone','details','evidence','otherReason'].forEach(function(id){
      const el = document.getElementById(id);
      if(el) el.removeAttribute('aria-invalid');
    });
    const dCounter = document.getElementById('detailsCounter');
    if(dCounter){ dCounter.textContent = '0 words'; dCounter.classList.remove('visible','error'); }
    const dFill = document.getElementById('detailsProgressFill');
    if(dFill){ dFill.style.width = '0%'; dFill.classList.remove('over'); dFill.setAttribute('aria-valuenow','0'); }
    const dzLabelEl = document.getElementById('dzLabel'); if(dzLabelEl) dzLabelEl.textContent = 'Choose a file or drag & drop here';
    const dzClear = document.getElementById('dzClearBtn'); if(dzClear) dzClear.classList.add('hidden');
    const dzProg = document.getElementById('dzProgress'); if(dzProg) dzProg.classList.add('hidden');
    const dzBar = document.getElementById('dzProgressBar'); if(dzBar) dzBar.style.width = '0%';
    const emailSug = document.getElementById('emailSuggestions'); if(emailSug) emailSug.classList.add('hidden');
    if(toastEl){ clearTimeout(showToast._t); toastEl.classList.add('hidden'); }
  }

  function setValidationIcon(inputEl, state){
    if(!inputEl) return;
    const wrap = inputEl.closest('.relative');
    if(!wrap) return;
    const icon = wrap.querySelector('.field-valid');
    if(!icon) return;
    icon.classList.remove('visible','error');
    if(state === 'valid'){
      icon.classList.add('visible');
    } else if(state === 'invalid'){
      icon.classList.add('visible','error');
    }
  }
  function validateName(){
    const v = (form.name.value || '').trim();
    return !!v;
  }
  function validateEmail(){
    const v = (emailInput.value || '').trim();
    if(!v){ setValidationIcon(emailInput, null); return false; }
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if(!pattern.test(v)){ setValidationIcon(emailInput, 'invalid'); return false; }
    setValidationIcon(emailInput, 'valid'); return true;
  }
  function validatePhone(){
    const v = (phoneInput.value || '').trim();
    if(!v){ 
      setValidationIcon(phoneInput, null); return true;
    }
    const lib = window.libphonenumber || window['libphonenumber-js'];
    if(lib){
      try{
        const parsed = lib.parsePhoneNumberFromString(v);
        if(parsed && parsed.isValid && parsed.isValid()){
          setValidationIcon(phoneInput, 'valid'); return true;
        }
      }catch(e){ }
    }
    const digits = v.replace(/\D/g,'');
    if(digits.length >= 7){ setValidationIcon(phoneInput, 'valid'); return true; }
    setValidationIcon(phoneInput, 'invalid'); return false;
  }

  form.name?.addEventListener('input', function(){
    try{
      const wrap = form.name.closest('.relative');
      const icon = wrap?.querySelector('.field-valid');
      if(icon){ icon.classList.remove('visible','error'); }
    }catch(e){}
  });
  form.name?.addEventListener('blur', function(){
    try{
      if(!(form.name.value || '').trim()){
        const wrap = form.name.closest('.relative');
        const icon = wrap?.querySelector('.field-valid');
        if(icon){ icon.classList.remove('visible','error'); }
      }
    }catch(e){}
  });
  form.name?.addEventListener('change', function(){
    try{
      if(!(form.name.value || '').trim()){
        const wrap = form.name.closest('.relative');
        const icon = wrap?.querySelector('.field-valid');
        if(icon){ icon.classList.remove('visible','error'); }
      }
    }catch(e){}
  });
  emailInput?.addEventListener('input', function(){ validateEmail(); });
  phoneInput?.addEventListener('input', function(){ validatePhone(); });

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
    if(file.size > maxBytes){ formMessage.textContent = 'Attachment too large (max 5MB).'; formMessage.style.color = '#ef4444'; showToast('Attachment too large (max 5MB).','error'); return; }
    if(!okTypes.includes(file.type)){ formMessage.textContent = 'Unsupported file type. Use JPG, PNG, or PDF.'; formMessage.style.color = '#ef4444'; showToast('Unsupported file type. Use JPG, PNG, or PDF.','error'); return; }
    dzLabel.textContent = file.name;
    dzClearBtn?.classList.remove('hidden');
    if(dzProgress){ dzProgress.classList.remove('hidden'); dzProgress.setAttribute('aria-hidden','false'); dzProgressBar.style.width = '4%'; dzProgressBar.setAttribute('aria-valuenow','4'); }
    try{
      const reader = new FileReader();
      reader.onprogress = function(e){ if(e.lengthComputable && dzProgressBar){ const pct = Math.round((e.loaded / e.total) * 100); dzProgressBar.style.width = pct + '%'; dzProgressBar.setAttribute('aria-valuenow', String(pct)); } };
      reader.onload = function(){ if(dzProgressBar){ dzProgressBar.style.width = '100%'; dzProgressBar.setAttribute('aria-valuenow','100'); setTimeout(function(){ if(dzProgress) dzProgress.classList.add('hidden'); }, 600); }
      };
      reader.onerror = function(){ formMessage.textContent = 'Error reading file.'; formMessage.style.color = '#ef4444'; showToast('Error reading file.','error'); };
      reader.readAsArrayBuffer(file);
    }catch(e){ /* ignore */ }
  }

  if(detailsEl && detailsCounter){
    function countWords(text){
      if(!text) return 0;
      return text.trim().split(/\s+/).filter(Boolean).length;
    }
    const detailsProgressFill = document.getElementById('detailsProgressFill');
    const detailsMinLabel = document.getElementById('detailsMinLabel');
    const detailsMaxLabel = document.getElementById('detailsMaxLabel');
    function updateDetailsCounter(){
      const text = detailsEl.value || '';
      const words = countWords(text);
      const minWords = parseInt(detailsEl.dataset.minWords, 10) || 50;
      const maxWords = parseInt(detailsEl.dataset.maxWords, 10) || 150;
      if(detailsMinLabel) detailsMinLabel.textContent = String(minWords);
      if(detailsMaxLabel) detailsMaxLabel.textContent = String(maxWords);
      if(words > 0){ detailsCounter.classList.add('visible'); } else { detailsCounter.classList.remove('visible'); }
      let pct = 0;
      if(words <= minWords){
        pct = Math.round((words / minWords) * 100);
      } else if(words > minWords && words < maxWords){
        pct = Math.round(((words - minWords) / (maxWords - minWords)) * 100);
      } else { pct = 100; }
      pct = Math.max(0, Math.min(100, pct));
      if(detailsProgressFill){ detailsProgressFill.style.width = pct + '%'; detailsProgressFill.setAttribute('aria-valuenow', String(pct)); }
      if(words < minWords){
        const need = minWords - words;
        detailsCounter.innerHTML = `${words} word${words===1?'':'s'} — <span class="char-need">need ${need} more</span>`;
        detailsCounter.classList.remove('error');
        detailsProgressFill.classList.remove('over');
      } else if(words > maxWords){
        const over = words - maxWords;
        detailsCounter.innerHTML = `${words} word${words===1?'':'s'} — <span class="char-over">+${over}</span> over maximum`;
        detailsCounter.classList.add('error');
        if(detailsProgressFill) detailsProgressFill.classList.add('over');
      } else {
        const over = words - minWords;
        detailsCounter.innerHTML = `${words} word${words===1?'':'s'} — ${over>0?`+${over} over minimum`: 'meets minimum'}`;
        detailsCounter.classList.remove('error');
        detailsProgressFill.classList.remove('over');
      }
    }
    detailsEl.addEventListener('input', updateDetailsCounter);
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
  const country = document.getElementById('country');
  if(form.phone && form.phone.value){
    const raw = form.phone.value.trim();
    let normalized = raw.replace(/[^+\d]/g,'');
    const ccMap = {GB:'+44',US:'+1',CA:'+1',AU:'+61',NZ:'+64',IE:'+353',FR:'+33',DE:'+49',ES:'+34',IT:'+39'};
    const cc = ccMap[country?.value || 'GB'];
    if(normalized.startsWith('+')){
    } else if(normalized.startsWith('0')){
      normalized = cc + normalized.slice(1);
    } else {
      normalized = cc + normalized;
    }
    form.phone.value = normalized;
  }
  
  form.name.setAttribute('aria-invalid','false');
  form.email.setAttribute('aria-invalid','false');
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

  if(evidence && evidence.files && evidence.files[0]){
    const file = evidence.files[0];
    const maxBytes = 5 * 1024 * 1024; 
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

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if(!emailPattern.test(email)){
    showError(form.email, 'Enter a valid email (e.g., name@example.com).');
    formMessage.textContent = 'Please fix the errors and try again.';
    formMessage.style.color = '#ef4444';
    form.email.focus();
    return;
  }
  const detailsField = document.getElementById('details');
  const detailText = detailsField ? detailsField.value || '' : '';
  const wordCount = detailText.trim() ? detailText.trim().split(/\s+/).filter(Boolean).length : 0;
  const minWords = detailsField ? parseInt(detailsField.dataset.minWords, 10) || 50 : 50;
  const maxWords = detailsField ? parseInt(detailsField.dataset.maxWords, 10) || 150 : 150;
  if(wordCount < minWords || wordCount > maxWords){
    showError(detailsField, `Details must be between ${minWords} and ${maxWords} words. Current: ${wordCount}.`);
    formMessage.textContent = 'Please adjust the details to meet the word limits.';
    formMessage.style.color = '#ef4444';
    detailsField.focus();
    return;
  }
  formMessage.textContent = '';
  
  const now = new Date();
  const year = now.getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
  const referenceNum = `SG-${year}-${randomNum}`;
  
  const refEl = document.getElementById('referenceNumber');
  if(refEl) {
    refEl.textContent = referenceNum;
  }
  
  const modal = document.getElementById('thankYouModal');
  const closeBtn = document.getElementById('closeModal');
  const previousActive = document.activeElement;
  if(modal){
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
    if(closeBtn){closeBtn.focus()}
    if(confirmCopy && confirmCopy.checked){
    }
    function closeHandler(){
      try{ resetFormUI(); }catch(e){}
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden','true');
      closeBtn.removeEventListener('click', closeHandler);
      document.removeEventListener('keydown', escHandler);
      modal.querySelector('[data-modal-overlay]')?.removeEventListener('click', closeHandler);
      if(previousActive){previousActive.focus()}
    }
    function escHandler(ev){if(ev.key==='Escape'){closeHandler()}}
    closeBtn.addEventListener('click', closeHandler);
    document.addEventListener('keydown', escHandler);
    modal.querySelector('[data-modal-overlay]')?.addEventListener('click', closeHandler);
  }
  form.reset();
  try{ resetFormUI(); }catch(e){}
})
  
}

  const yearEl = document.getElementById('year');
  if(yearEl){yearEl.textContent = new Date().getFullYear()}

const voiceInputBtn = document.getElementById('voiceInputBtn');
const detailsField = document.getElementById('details');
if(voiceInputBtn && detailsField && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-GB';
  
  voiceInputBtn.addEventListener('click', function(){
    voiceInputBtn.classList.add('listening');
    try{
      recognition.start();
    }catch(e){
      console.error('Speech recognition error:', e);
      voiceInputBtn.classList.remove('listening');
    }
  });
  
  recognition.onresult = function(event){
    const transcript = event.results[0][0].transcript;
    if(detailsField.value){
      detailsField.value += ' ' + transcript;
    }else{
      detailsField.value = transcript;
    }
    detailsField.dispatchEvent(new Event('input'));
    voiceInputBtn.classList.remove('listening');
  };
  
  recognition.onerror = function(event){
    console.error('Speech recognition error:', event.error);
    voiceInputBtn.classList.remove('listening');
    if(event.error === 'not-allowed'){
      showToast('Microphone access denied', 'error');
    }
  };
  
  recognition.onend = function(){
    voiceInputBtn.classList.remove('listening');
  };
}else if(voiceInputBtn){
  voiceInputBtn.style.display = 'none';
}

const submitBtn = document.getElementById('submitBtn');
const submitBtnText = document.getElementById('submitBtnText');
const submitSpinner = document.getElementById('submitSpinner');
if(form && submitBtn){
  form.addEventListener('submit', function(){
    if(submitBtnText && submitSpinner){
      submitBtnText.textContent = 'Submitting...';
      submitSpinner.classList.remove('hidden');
      submitBtn.disabled = true;
    }
    setTimeout(function(){
      if(submitBtnText && submitSpinner){
        submitBtnText.textContent = 'Submit Report';
        submitSpinner.classList.add('hidden');
        submitBtn.disabled = false;
      }
    }, 2000);
  });
}

const reportsCounter = document.getElementById('reportsThisMonth');
if(reportsCounter){
  const randomReports = Math.floor(Math.random() * (342 - 187 + 1)) + 187;
  reportsCounter.dataset.count = randomReports;
  
  const observerOptions = {threshold: 0.5};
  const observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting && !reportsCounter.dataset.animated){
        reportsCounter.dataset.animated = 'true';
        const duration = 2000;
        const start = 0;
        const startTime = performance.now();
        
        function update(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeOutQuart = 1 - Math.pow(1 - progress, 4);
          const current = Math.floor(start + (randomReports - start) * easeOutQuart);
          
          reportsCounter.textContent = current;
          
          if (progress < 1) {
            requestAnimationFrame(update);
          } else {
            reportsCounter.textContent = randomReports;
          }
        }
        
        requestAnimationFrame(update);
      }
    });
  }, observerOptions);
  observer.observe(reportsCounter);
}

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

const regionFilter = document.getElementById('regionFilter');
const regionalGrid = document.getElementById('regionalGrid');
const regionSearch = document.getElementById('regionSearch');
const visibleCountEl = document.getElementById('visibleCount');
const totalCountEl = document.getElementById('totalCount');

if(regionFilter && regionalGrid){
  function updateCounter(){
    const allCards = regionalGrid.querySelectorAll('[data-region]');
    const visibleCards = regionalGrid.querySelectorAll('[data-region]:not(.hidden)');
    if(totalCountEl) totalCountEl.textContent = allCards.length;
    if(visibleCountEl) visibleCountEl.textContent = visibleCards.length;
  }
  
  updateCounter();
  
  regionFilter.addEventListener('change', function(){
    const val = regionFilter.value;
    const allCards = regionalGrid.querySelectorAll('[data-region]');
    
    if(val === 'default'){
      allCards.forEach(function(card, index){
        card.classList.toggle('hidden', index >= 4);
      });
    } else if(val === 'all'){
      allCards.forEach(function(card){
        card.classList.remove('hidden');
      });
    } else {
      allCards.forEach(function(card){
        const region = card.getAttribute('data-region');
        card.classList.toggle('hidden', region !== val);
      });
    }
    
    if(regionSearch) regionSearch.value = '';
    updateCounter();
  });
}

if(regionSearch && regionalGrid){
  function applyCombinedFilter(){
    const selectVal = regionFilter ? regionFilter.value : 'default';
    const q = regionSearch.value.trim().toLowerCase();
    
    if(q){
      regionalGrid.querySelectorAll('[data-region]').forEach(function(card){
        const name = (card.getAttribute('data-name') || '').toLowerCase();
        const matchesQuery = name.includes(q);
        card.classList.toggle('hidden', !matchesQuery);
      });
    } else {
      if(selectVal === 'default'){
        const allCards = regionalGrid.querySelectorAll('[data-region]');
        allCards.forEach(function(card, index){
          card.classList.toggle('hidden', index >= 4);
        });
      } else if(selectVal === 'all'){
        regionalGrid.querySelectorAll('[data-region]').forEach(function(card){
          card.classList.remove('hidden');
        });
      } else {
        regionalGrid.querySelectorAll('[data-region]').forEach(function(card){
          const region = card.getAttribute('data-region');
          card.classList.toggle('hidden', region !== selectVal);
        });
      }
    }
    
    if(visibleCountEl && totalCountEl){
      const allCards = regionalGrid.querySelectorAll('[data-region]');
      const visibleCards = regionalGrid.querySelectorAll('[data-region]:not(.hidden)');
      if(totalCountEl) totalCountEl.textContent = allCards.length;
      if(visibleCountEl) visibleCountEl.textContent = visibleCards.length;
    }
  }
  regionSearch.addEventListener('input', applyCombinedFilter);
  if(regionFilter){regionFilter.addEventListener('change', applyCombinedFilter)}
}

document.querySelectorAll('.faq-toggle').forEach(function(btn){
  btn.addEventListener('click', function(){
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    if(panel){
      panel.classList.toggle('hidden');
    }
  });
});

function animateCounter(element, target, suffix = '') {
  const duration = 2000;
  const start = 0;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const current = Math.floor(start + (target - start) * easeOutQuart);
    
    if (target === 24) {
      element.textContent = '24/7';
    } else if (target >= 1000) {
      element.textContent = (current / 1000).toFixed(1) + 'K+' + suffix;
    } else {
      element.textContent = current + (suffix || '%');
    }
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      if (target === 24) {
        element.textContent = '24/7';
      } else if (target >= 1000) {
        element.textContent = (target / 1000).toFixed(1) + 'K+' + suffix;
      } else {
        element.textContent = target + (suffix || '%');
      }
    }
  }
  
  requestAnimationFrame(update);
}

const counters = document.querySelectorAll('[data-count]');
if (counters.length > 0) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = 'true';
        const target = parseInt(entry.target.dataset.count);
        animateCounter(entry.target, target);
      }
    });
  }, { threshold: 0.5 });
  
  counters.forEach(counter => observer.observe(counter));
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href === '#' || href === '#home') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const headerOffset = 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  });
});

const anonymousToggle = document.getElementById('anonymousToggle');
const anonymousExplainer = document.getElementById('anonymousExplainer');
const shieldIcon = document.getElementById('shieldIcon');
const anonymousSection = document.getElementById('anonymousSection');

if (anonymousToggle && anonymousExplainer && shieldIcon) {
  anonymousToggle.addEventListener('change', function() {
    if (this.checked) {
      anonymousExplainer.classList.remove('hidden');
      shieldIcon.classList.remove('text-slate-400');
      shieldIcon.classList.add('text-brand');
      anonymousSection.style.borderColor = 'rgba(139,92,246,0.4)';
      anonymousSection.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(255,255,255,0.95) 100%)';
    } else {
      anonymousExplainer.classList.add('hidden');
      shieldIcon.classList.remove('text-brand');
      shieldIcon.classList.add('text-slate-400');
      anonymousSection.style.borderColor = 'rgba(139,92,246,0.2)';
      anonymousSection.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.05) 0%, rgba(255,255,255,0.9) 100%)';
    }
  });
}

function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        button.classList.add('copied');
        const tooltip = document.createElement('span');
        tooltip.className = 'copy-tooltip show';
        tooltip.textContent = 'Copied!';
        button.style.position = 'relative';
        button.appendChild(tooltip);
        setTimeout(() => {
            button.classList.remove('copied');
            tooltip.classList.remove('show');
            setTimeout(() => tooltip.remove(), 200);
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

document.querySelectorAll('.phone-num').forEach(phoneSpan => {
    const phoneText = phoneSpan.textContent.trim();
    const parentDiv = phoneSpan.closest('div');
    
    if (parentDiv && !parentDiv.classList.contains('phone-with-copy')) {
        parentDiv.classList.add('phone-with-copy');
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-phone-btn';
        copyBtn.setAttribute('aria-label', `Copy ${phoneText}`);
        copyBtn.innerHTML = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>';
        parentDiv.appendChild(copyBtn);
    }
});

document.querySelectorAll('.copy-phone-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const phoneNum = btn.parentElement.querySelector('.phone-num');
        const phoneText = phoneNum ? phoneNum.textContent.trim() : '';
        if (phoneText) {
            copyToClipboard(phoneText, btn);
        }
    });
});

const copyRefBtn = document.getElementById('copyRefBtn');
if (copyRefBtn) {
    copyRefBtn.addEventListener('click', () => {
        const refNumber = document.getElementById('referenceNumber').textContent.trim();
        copyToClipboard(refNumber, copyRefBtn);
    });
}

const faqSearch = document.getElementById('faqSearch');
if (faqSearch) {
    faqSearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('.faq-item').forEach(item => {
            const question = item.getAttribute('data-faq-question')?.toLowerCase() || '';
            if (query === '' || question.includes(query)) {
                item.classList.remove('hidden');
                if (query !== '') {
                    item.classList.add('match');
                } else {
                    item.classList.remove('match');
                }
            } else {
                item.classList.add('hidden');
                item.classList.remove('match');
            }
        });
    });
}

document.querySelectorAll('.faq-helpful-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const parent = btn.closest('.faq-helpful');
        parent.querySelectorAll('.faq-helpful-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        setTimeout(() => {
            const feedback = btn.textContent.includes('👍') ? 'positive' : 'negative';
            console.log(`FAQ feedback: ${feedback}`);
        }, 100);
    });
});

let ticking = false;
function updateParallax() {
    const scrolled = window.pageYOffset;
    const parallaxBg = document.querySelector('.parallax-bg');
    if (parallaxBg && scrolled < window.innerHeight * 1.5) {
        parallaxBg.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
    ticking = false;
}
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
    }
});
