const form = document.getElementById('reportForm');
const formMessage = document.getElementById('formMessage');
form.addEventListener('submit', function(e){
  e.preventDefault();
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const details = form.details.value.trim();
  if(!name || !email || !details){
    formMessage.textContent = 'Please complete all required fields.';
    return
  }
  formMessage.textContent = 'Report submitted. Thank you — our safeguarding team will review your report.';
  formMessage.classList.add('form-success');
  form.reset();
  setTimeout(()=>{formMessage.textContent = ''; formMessage.classList.remove('form-success')}, 5000)
})

  const yearEl = document.getElementById('year');
  if(yearEl){yearEl.textContent = new Date().getFullYear()}
