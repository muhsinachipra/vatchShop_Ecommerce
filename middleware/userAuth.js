module.exports = {

  isUserLogin: async (req, res, next) => {
    try {
      if (req.session.userId) {
        next(); // User is logged in, proceed to the next middleware or route
      } else {
        res.redirect('/login'); // User is not logged in, redirect to login page
      }
    }
    catch (error) {
      console.log(error.message);
    }
  }

}
