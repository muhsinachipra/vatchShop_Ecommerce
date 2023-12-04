function validEditProfile() {
    // Get form values
    const firstName = document.getElementById('EPFname').value;
    const lastName = document.getElementById('EPLname').value;
    const mobile = document.getElementById('EPmobile').value;

    // Reset any previous error messages
    document.getElementById('EPFnameError').textContent = '';
    document.getElementById('EPLnameError').textContent = '';
    document.getElementById('EPmobileError').textContent = '';

    // Validate first name
    const firstNameRegex = /^[A-Za-z]+$/; // Regex to allow only alphabets
    if (!firstName.trim()) {
        document.getElementById('EPFnameError').textContent = 'First name is required';
        return false;
    } else if (!firstNameRegex.test(firstName)) {
        document.getElementById('EPFnameError').textContent = 'First name should contain only alphabets';
        return false;
    }

    // Validate last name
    const lastNameRegex = /^[A-Za-z]+$/; // Regex to allow only alphabets
    if (!lastName.trim()) {
        document.getElementById('EPLnameError').textContent = 'Last name is required';
        return false;
    } else if (!lastNameRegex.test(lastName)) {
        document.getElementById('EPLnameError').textContent = 'Last name should contain only alphabets';
        return false;
    }

    const mobileRegex = /^[6-9]\d{9}$/;

    if (!mobile || !mobileRegex.test(mobile)) {
        document.getElementById('EPmobileError').textContent = 'Mobile number should be a 10-digit valid number';
        return false;
    }

    if (new Set(mobile).size === 1) {
        document.getElementById('EPmobileError').textContent = 'Mobile number should not consist of the same digit.';
        return false;
    }

    return true;
}