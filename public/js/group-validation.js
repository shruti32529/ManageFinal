function validateGroupForm(form) {
  const groupName = form.querySelector('#groupName').value;
  const groupLevel = form.querySelector('#groupLevel').value;
  let isValid = true;
  const errors = [];

  if (groupName.length < 3) {
    errors.push('Group name must be at least 3 characters');
    isValid = false;
  }

  if (!groupLevel) {
    errors.push('Please select a group level');
    isValid = false;
  }

  if (!isValid) {
    showFormErrors(errors);
  }
  return isValid;
}

function showFormErrors(errors) {
  const errorDiv = document.getElementById('formErrors');
  errorDiv.innerHTML = errors.map(error => `<div>${error}</div>`).join('');
  errorDiv.style.display = errors.length ? 'block' : 'none';
}

// Add to both add and edit forms
document.querySelectorAll('#addGroupForm, #editGroupForm').forEach(form => {
  form.addEventListener('submit', (e) => {
    if (!validateGroupForm(e.target)) {
      e.preventDefault();
    }
  });
});
