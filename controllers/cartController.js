const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Category = require('../models/categoryModel');
const Admin = require('../models/adminModel');

const { ObjectId } = require('mongoose').Types;

const { name } = require('ejs');
const path = require("path")


module.exports = {
    addToCart: async (req, res) => {
        try {
            if (req.session.userId) {
                const productId = req.body.id;
                const userId = req.session.userId;

                // Fetch user details
                const userData = await User.findById(userId);
                if (!userData) {
                    return res.status(404).json({ error: 'User not found' });
                }

                // Fetch product details
                const productData = await Product.findById(productId);
                if (!productData) {
                    return res.status(404).json({ error: 'Product not found' });
                }

                if (productData.productStock == 0) {
                    console.log('Out of stock');
                    return res.json({ outofstock: true });
                }

                // Fetch user's cart
                let userCart = await Cart.findOne({ userId: userId });

                if (!userCart) {
                    // If the user doesn't have a cart, create a new one
                    userCart = new Cart({ userId: userId, items: [], subTotal: 0 }); // Set a default value for subTotal
                }

                // Check if the product is already in the cart
                const existingProductIndex = userCart.items.findIndex(product => String(product.productId) === String(productId));

                if (existingProductIndex !== -1) {
                    // If the product is in the cart, update the quantity
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
                    // If the product is not in the cart, add it
                    userCart.items.push({ productId: productId, quantity: 1 });
                }

                // Update subTotal
                await userCart.calculateSubTotal();

                // Save the updated cart
                await userCart.save();

                res.json({ success: true });
            } else {
                res.json({ loginRequired: true });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'An error occurred' });
        }
    },
    loadCart: async (req, res) => {
        try {
            if (req.session.userId) {
                const userId = req.session.userId;
                const cartData = await Cart.findOne({ userId: userId }).populate("items.productId");

                if (cartData && cartData.items.length > 0) {
                    let total = 0;

                    // Calculate total
                    cartData.items.forEach((product) => {
                        total += product.quantity * product.productId.productPrice;
                    });

                    // Render the 'cart' view with the calculated total
                    res.render('cart', { user: req.session.userId, userId: userId, cart: cartData.items, total: total });
                } else {
                    // If the cart is empty, render 'cart' view with an empty cart array
                    res.render('cart', { user: req.session.userId, cart: [], total: 0 });
                }
            } else {

                res.redirect('/login?errors=Please log in to view');

            }
        } catch (error) {
            // Handle any errors by rendering the 'error' view
            console.log(error);
            res.status(500).json({ error: 'An error occurred' });
        }
    },
    cartQuantity: async (req, res) => {
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

            // Calculate new quantity and total
            const newQuantity = cartItem.quantity + quantityChange;
            if (newQuantity < 1) {
                return res.status(400).json({ success: false, message: 'Quantity cannot be less than 1' });
            } else if (newQuantity > productStock) {
                return res.status(400).json({ success: false, message: 'Product stock exceeded' });
            } else if (newQuantity > 10) {
                return res.status(400).json({ success: false, message: 'Only 10 items can be purchased' });
            }

            // Update the quantity and total for the cart item
            cartItem.quantity = newQuantity;

            // Update subTotal
            await cart.calculateSubTotal();

            // Save the updated cart
            await cart.save();

            return res.status(200).json({ changeSuccess: true, message: 'Quantity updated successfully', cart });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ changeSuccess: false, message: 'Internal server error' });
        }
    },
    removeProduct: async (req, res) => {
        try {
            const proId = req.body.product;
            const user = req.session.userId;

            // Find the user's cart and update it to remove the specified product
            const cartData = await Cart.findOneAndUpdate(
                { "items.productId": proId },
                { $pull: { items: { productId: proId } } }
            );

            // Check if the product was found and removed
            if (cartData) {
                res.json({ success: true });
            } else {
                res.json({ error: 'Product not found in the cart' });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'An error occurred' });
        }
    },
    cartCount: async (req, res) => {
        try {
            const userId = req.session.userId;

            // Fetch the cart data from the database based on the user ID
            const cart = await Cart.findOne({ userId });

            // If the cart is found, send the total number of items to the client
            if (cart) {
                const totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);
                res.json({ totalItems });
            } else {
                res.json({ totalItems: 0 }); // If no cart is found, assume 0 items
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'An error occurred' });
        }
    }
}