function validAddress() {
    const name = document.getElementById('fullName').value;
    const mobile = document.getElementById('phone').value;
    const state = document.getElementById('state').value;
    const district = document.getElementById('district').value;
    const city = document.getElementById('city').value;
    const pincode = document.getElementById('pinCode').value;
  
    document.getElementById('name-error').textContent = '';
    document.getElementById('state-error').textContent = '';
    document.getElementById('mobile-error').textContent = '';
    document.getElementById('district-error').textContent = '';
    document.getElementById('city-error').textContent = '';
    document.getElementById('pincode-error').textContent = '';
  
    if (!name) {
        document.getElementById('name-error').textContent = 'Name field should not be empty!';
        return false;
    }
  
    if (!state) {
        document.getElementById('state-error').textContent = 'State field should not be empty!';
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
  
    if (!district) {
        document.getElementById('district-error').textContent = 'District field should not be empty!';
        return false;
    }
  
    if (!city) {
        document.getElementById('city-error').textContent = 'City field should not be empty!';
        return false;
    }
  
    const pincodeRegex = /^\d{6}$/;
  
    if (!pincode || !pincode.match(pincodeRegex)) {
        document.getElementById('pincode-error').textContent = 'Pincode should be a 6-digit numeric value.';
        return false;
    }
  
    return true;
  }