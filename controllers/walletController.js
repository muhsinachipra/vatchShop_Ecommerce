const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Wallet = require('../models/walletModel');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const otpGenerator = require("otp-generator");
const randomstring = require('randomstring');

const Razorpay = require('razorpay')
const crypto = require("crypto")

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


module.exports = {
    loadAddWallet: async (req, res, next) => {
        try {
            res.render('wallet', { user: req.session.userId });
        } catch (error) {
            next(error);
        }
    },
    addToWallet: async (req, res, next) => {
        try {
            const { amount } = req.body;
            const userId = req.session.userId;

            const Amount = amount * 100;

            let walletId = randomstring.generate(10);
            const options = {
                amount: Amount, // Use the total balance in paise
                currency: "INR",
                receipt: "" + walletId,
            };

            instance.orders.create(options, async function (err, wallet) {
                if (err) {
                    console.error('Razorpay wallet creation failed:', err);
                    return razorPaymentFailed(res, "Razorpay wallet creation failed");
                }

                res.status(200).json({ wallet });
            });
        } catch (error) {
            next(error);
        }
    },

    verifyWalletPayment: async (req, res, next) => {
        try {
            const details = req.body;

            // Verify the Razorpay signature
            const hmac = crypto.createHmac("sha256", instance.key_secret);
            hmac.update(details.payment.razorpay_order_id + "|" + details.payment.razorpay_payment_id);
            const hmacValue = hmac.digest("hex");

            if (hmacValue !== details.payment.razorpay_signature) {
                // Signature verification failed
                await Wallet.findByIdAndRemove({ _id: details.wallet.receipt });
                return res.json({ success: false, message: "Signature verification failed" });
            }

            const userId = req.session.userId;
            // Update wallet balance and add a transaction
            const transactionId = details.wallet.receipt;

            // Check if the user already has a wallet
            const existingWallet = await Wallet.findOne({ userId });
            const Amount = (details.wallet.amount) / 100;

            let wallet;
            if (existingWallet) {
                // If the user has a wallet, update the balance and add a transaction
                existingWallet.totalAmount += Amount;
                existingWallet.walletHistory.push({
                    transactionAmount: Amount,
                    transactionType: 'credit',
                    transactionId,
                });

                wallet = existingWallet;
            } else {
                // If the user doesn't have a wallet, create a new wallet
                wallet = new Wallet({
                    userId,
                    totalAmount: Amount,
                    walletHistory: [{
                        transactionAmount: Amount,
                        transactionType: 'credit',
                        transactionId,
                    }],
                });
            }

            await wallet.save();

            // Associate the wallet ID with the user
            const user = await User.findById(userId);
            user.wallet = wallet._id;
            const usersavedwallet = await user.save();

            res.json({ success: true });
        } catch (error) {
            next(error);
        }
    },
}


