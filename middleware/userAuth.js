const isUserLogin = async (req, res, next) => {
    try {
      if (req.session.user_id) {
        next(); // User is logged in, proceed to the next middleware or route
      } else {
        res.redirect('/'); // User is not logged in, redirect to login page
      }
    } catch (error) {
      console.log(error.message);
    }
  }
  
  const isUserLogout = async (req, res, next) => {
    try {
      if (req.session.user_id) {
        res.redirect('/userHome'); // User is logged in, redirect to home
      } else {
        next(); // User is logged out, proceed to the next middleware or route
      }
    } catch (error) {
      console.log(error.message);
    }
  }
  
  module.exports = {
    isUserLogout,
    isUserLogin
  }
  