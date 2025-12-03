const form = document.getElementById('reportForm');
const formMessage = document.getElementById('formMessage');
if(form){
form.addEventListener('submit', function(e){
  e.preventDefault();
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const details = form.details.value.trim();
  if(!name || !email || !details){
    formMessage.textContent = 'Please complete all required fields.';
    formMessage.style.color = 'var(--brand)';
    return
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if(!emailPattern.test(email)){
    formMessage.textContent = 'Please enter a valid email address.';
    formMessage.style.color = '#ef4444';
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
