function validEditAddress() {
  const name = document.getElementById('Fname').value;
  const lname = document.getElementById('Lname').value;
  const mobile = document.getElementById('mobile').value;

  document.getElementById('Fname-error').textContent = '';
  document.getElementById('Lname-error').textContent = '';
  document.getElementById('mobile-error').textContent = '';

  if (!name) {
      document.getElementById('Fname-error').textContent = 'First name field should not be empty!';
      return false;
  }

  if (!lname) {
      document.getElementById('Lname-error').textContent = 'Last name field should not be empty!';
      return false;
  }

  const mobileRegex = /^[6-9]\d{9}$/;

  if (!mobile || !mobileRegex.test(mobile)) {
      document.getElementById('mobile-error').textContent = 'Mobile number should be a 10-digit valid number';
      return false;
  }

  if (new Set(mobile).size === 1) {
      document.getElementById('mobile-error').textContent = 'Mobile number should not consist of the same digit.';
      return false;
  }

  return true;
}