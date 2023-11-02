function validatePasswords() {
    const currentPassword = document.querySelector('input[name="oldPassword"]').value;
    const newPassword = document.querySelector('input[name="newPassword"]').value;
  
    const passwordRegex = /^(?=.*[!@#$%^&*]).{6,}$/;
  
    if (!currentPassword || !passwordRegex.test(currentPassword)) {
        document.getElementById('current-password-error').textContent = 'Current password must be at least 6 characters and contain a special character.';
        return false;
    }
  
    if (!newPassword || !passwordRegex.test(newPassword)) {
        document.getElementById('new-password-error').textContent = 'New password must be at least 6 characters and contain a special character.';
        return false;
    }
  
    return true;
  }