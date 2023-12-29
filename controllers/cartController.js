const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Category = require('../models/categoryModel');
const Admin = require('../models/adminModel');

const { ObjectId } = require('mongoose').Types;

const { name } = require('ejs');
const path = require("path")


module.exports = {
    addToCart: async (req, res, next) => {
        try {
            console.log('entered addToCart')
            if (req.session.userId) {
                const productId = req.body.id;
                const userId = req.session.userId;

                const userData = await User.findById(userId);
                if (!userData) {
                    return res.status(404).json({ error: 'User not found' });
                }

                const productData = await Product.findById(productId);
                if (!productData) {
                    return res.status(404).json({ error: 'Product not found' });
                }

                if (productData.productStock == 0) {
                    console.log('Out of stock');
                    return res.json({ outofstock: true });
                }

                let userCart = await Cart.findOne({ userId: userId });

                if (!userCart) {
                    userCart = new Cart({ userId: userId, items: [], subTotal: 0 }); 
                }

                const existingProductIndex = userCart.items.findIndex(product => String(product.productId) === String(productId));

                if (existingProductIndex !== -1) {
                    const existingProduct = userCart.items[existingProductIndex];

                    console.log('Product Stock:', productData.productStock);
                    console.log('Existing Quantity:', existingProduct.quantity);
                    if (productData.productStock <= existingProduct.quantity) {
                        console.log('Out of stock');
                        return res.json({ outofstock: true });
                    } else {
                        existingProduct.quantity += 1;
                    }
                } else {
                    userCart.items.push({ productId: productId, quantity: 1 });
                }

                await userCart.calculateSubTotal();

                await userCart.save();

                res.json({ success: true });
            } else {
                res.json({ loginRequired: true });
            }
        } catch (error) {
            next(error);
        }
    },
    loadCart: async (req, res, next) => {
        try {
            if (req.session.userId) {
                const userId = req.session.userId;
                const cartData = await Cart.findOne({ userId: userId }).populate("items.productId");

                if (cartData && cartData.items.length > 0) {
                    let total = 0;

                    cartData.items.forEach((product) => {
                        total += product.quantity * product.productId.discountedPrice;
                    });

                    res.render('cart', { user: req.session.userId, userId: userId, cart: cartData.items, total: total });
                } else {
                    res.render('cart', { user: req.session.userId, cart: [], total: 0 });
                }
            } else {

                res.redirect('/login?errors=Please log in to view');

            }
        } catch (error) {
            next(error);
        }
    },
    cartQuantity: async (req, res, next) => {
        const user_id = req.body.user;
        const product_Id = req.body.product;
        const number = parseInt(req.body.count);
        const quantityChange = number;

        try {
            const cart = await Cart.findOne({ userId: user_id });
            if (!cart) {
                return res.status(404).json({ success: false, message: 'Cart not found' });
            }

            const cartItem = cart.items.find(item => item.productId.toString() === product_Id);
            if (!cartItem) {
                return res.status(404).json({ success: false, message: 'Product not found in the cart' });
            }

            const productData = await Product.findOne({ _id: product_Id })

            const productStock = productData.productStock

            const newQuantity = cartItem.quantity + quantityChange;
            if (newQuantity < 1) {
                return res.status(400).json({ success: false, message: 'Quantity cannot be less than 1' });
            } else if (newQuantity > productStock) {
                return res.status(400).json({ success: false, message: 'Product stock exceeded' });
            } else if (newQuantity > 10) {
                return res.status(400).json({ success: false, message: 'Only 10 items can be purchased' });
            }

            cartItem.quantity = newQuantity;

            await cart.calculateSubTotal();

            await cart.save();

            return res.status(200).json({ changeSuccess: true, message: 'Quantity updated successfully', cart });

        } catch (error) {
            next(error);
        }
    },
    removeProduct: async (req, res, next) => {
        try {
            const proId = req.body.product;
            const user = req.session.userId;

            const cartData = await Cart.findOneAndUpdate(
                { "items.productId": proId },
                { $pull: { items: { productId: proId } } }
            );

            if (cartData) {
                res.json({ success: true });
            } else {
                res.json({ error: 'Product not found in the cart' });
            }
        } catch (error) {
            next(error);
        }
    },
    cartCount: async (req, res, next) => {
        try {
            const userId = req.session.userId;

            const cart = await Cart.findOne({ userId });

            if (cart) {
                const totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);
                res.json({ totalItems });
            } else {
                res.json({ totalItems: 0 }); 
            }
        } catch (error) {
            next(error);
        }
    }
}