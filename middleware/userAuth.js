const User = require('../models/userModel');

module.exports = {
  isUserLogin: async (req, res, next) => {
    try {
      if (req.session.userId) {
        const user = await User.findById(req.session.userId);
        if (user && user.isBlocked) {
          // User is blocked, log them out and redirect to login page
          delete req.session.userId;
          res.redirect('/login');
        } else {
          // User is not blocked, proceed to the next middleware or route
          next();
        }
      } else {
        res.redirect('/login'); // User is not logged in, redirect to login page
      }
    } catch (error) {
      console.log(error.message);
    }
  }
}