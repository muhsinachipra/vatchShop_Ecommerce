  // JavaScript to check if passwords match
  const password = document.getElementById("password");
  const passwordConfirm = document.getElementById("passwordConfirm");
  let passwordConfirmTouched = false;
  
  function validatePassword() {
    if (passwordConfirmTouched && password.value !== passwordConfirm.value) {
      passwordConfirm.setCustomValidity("Passwords do not match");
    } else {
      passwordConfirm.setCustomValidity("");
    }
  }
  
  password.addEventListener("change", validatePassword);
  passwordConfirm.addEventListener("change", function () {
    passwordConfirmTouched = true;
    validatePassword();
  });  



// // register validation


//   function validateForm() {
//     const password = document.getElementById("password");
//     const passwordConfirm = document.getElementById("passwordConfirm");
//     const email = document.getElementById("email");

//     // Validate password
//     const passwordRegex = /^(?=.*[a-zA-Z]).{5,}$/;
//     if (!passwordRegex.test(password.value)) {
//       alert("Password must be at least 5 characters and contain at least one letter.");
//       // password.setCustomValidity("Password must be at least 5 characters and contain at least one letter.");
//       return false;
//     }
//     // else{
//     //   password.setCustomValidity("");
//     //   return true;
//     // }

//     // Validate email
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email.value)) {
//       alert("Please enter a valid email address.");
//       return false;
//     }

//     return true; // Form will be submitted if all validations pass
//   }


//   login validation



function validateLoginForm() {
    const email = document.getElementById("email");
    const password = document.getElementById("password");

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
      alert("Please enter a valid email address.");
      return false;
    }

    // Validate password length
    if (password.value.length < 5) {
      alert("Password must be at least 5 characters.");
      return false;
    }

    return true; // Form will be submitted if all validations pass
  }


  function validateLoginForm() {
    const email = document.getElementById("email");

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
      alert("Please enter a valid email address.");
      return false;
    }

    return true; // Form will be submitted if all validations pass
  }