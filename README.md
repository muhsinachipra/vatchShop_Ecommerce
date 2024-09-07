# WatchShop E-Commerce Platform

Welcome to **WatchShop**, an e-commerce platform for purchasing various types of watches. This project showcases a full-fledged web application with user and admin functionalities, built using the **MERN stack** (MongoDB, Express.js, Node.js) and **EJS** for the front end.

🔗 https://vatchshopecommerce-production.up.railway.app/

## 🚀 Overview

WatchShop is designed to provide a seamless shopping experience for users and an efficient management system for admins. The platform primarily sells watches categorized into three types:
- **Analogue Watches**
- **Digital Watches**
- **Smartwatches**

### Key Features:

#### User Features:
- **User Authentication:** Users can sign up, log in, and manage their profiles.
- **Product Browsing:** Users can browse through different types of watches.
- **Cart and Wishlist:** Add products to the cart or wishlist for later purchase.
- **Checkout:** Complete the purchase with multiple payment options:
  - Razorpay integration for secure online payments.
  - Cash-on-delivery option.
- **Coupon System:** Apply discount coupons during checkout.
- **Order Management:** Users can view, track, and cancel their orders.
- **Wallet Refunds:** Cancelled orders are refunded to the user's wallet for future purchases.

#### Admin Features:
- **Admin Dashboard:** Provides an overview of sales, products, and user activity.
- **Product and Category Management:** Add, edit, and remove products and categories.
- **User Management:** Admins can manage users, including blocking/unblocking them if necessary.
- **Sales Reports:** Generate sales reports using MongoDB’s aggregation pipeline, with options to download reports and track order statuses.

## 🛠️ Technologies Used

- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **Frontend:** EJS, HTML, CSS, JavaScript, Bootstrap
- **Payment Gateway:** Razorpay API for online transactions
- **Other Dependencies:** 
  - **bcryptjs:** For password hashing
  - **Multer:** For handling file uploads
  - **Sharp:** For image processing (cropping, resizing)
  - **Nodemailer:** For email notifications
  - **dotenv:** For managing environment variables

## 📂 Folder Structure

```
│   .env
│   .gitignore
│   index.js
│   package.json
│
├───config
│       config.js
├───controllers
│       adminController.js
│       cartController.js
│       checkoutController.js
│       couponController.js
│       orderController.js
│       productController.js
│       profileController.js
│       userController.js
│       walletController.js
│       wishlistController.js
├───middleware
│       adminAuth.js
│       userAuth.js
├───models
│       addressModel.js
│       adminModel.js
│       cartModel.js
│       categoryModel.js
│       couponModel.js
│       orderModel.js
│       productModel.js
│       userModel.js
│       walletModel.js
│       wishlistModel.js
├───public
│   ├───adminAssets
│   ├───downloads
│   ├───productImages
│   └───userAssets
├───routes
│       adminRoute.js
│       userRoute.js
└───views
    ├───admin
    ├───users
    └───layouts
```

## 🛒 Installation and Setup

1. Clone the repository:
   ```bash
   git clone [https://github.com/username/watchshop.git](https://github.com/muhsinachipra/vatchShop_Ecommerce.git)
   cd watchshop
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory and define the following:
     ```
     MONGO_URL=<your-mongodb-uri>
     PORT=3000
     RAZORPAY_KEY_ID=<your-razorpay-key-id>
     RAZORPAY_KEY_SECRET=<your-razorpay-key-secret>
     SMTP_USER=<your-SMTP_USER>
     SMTP_PASS=<your-SMTP_PASS>
     ```

4. Start the application:
   ```bash
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`.

## 📈 Admin Access

To access the admin dashboard, navigate to `/admin` and use the admin credentials provided during setup.

## 📦 Dependencies

- Node.js
- MongoDB
- Express.js
- EJS
- Razorpay API
- bcryptjs, multer, sharp, dotenv, nodemailer, etc.

For the full list of dependencies, check the `package.json` file.

## 🎨 Frontend Design

- Developed using **HTML**, **CSS**, **JavaScript**, and **Bootstrap**.
- **EJS** is used for dynamic content rendering.
- **Ajax/Fetch/Axios** is utilized for seamless interactions.

## 📝 License

This project is licensed under the ISC License. See the LICENSE file for details.
