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
                // If user is not logged in, render 'login' view with an error message
                // res.render('login', { errors: "Please log in to view your cart" });
                // res.redirect('/login');
                res.redirect('/login?errors=Please log in to view');

            }
        } catch (error) {
            // Handle any errors by rendering the 'error' view
            console.log(error);
            res.status(500).json({ error: 'An error occurred' });
        }
    },
    // cartQuantity: async (req, res) => {
    //     try {
    //         const number = parseInt(req.body.count);
    //         const proId = req.body.product;
    //         const userId = req.body.user;
    //         const count = number;

    //         const cartData = await Cart.findOne(
    //             { userId: new ObjectId(userId), "items.productId": new ObjectId(proId) },
    //             { "items.productId.$": 1, "items.quantity": 1 }
    //         );

    //         const [{ quantity }] = cartData.items;

    //         const productData = await Product.findById(proId);

    //         // Check if the new quantity after the update will be greater than or equal to 1
    //         if (quantity + count >= 1) {
    //             if (productData.productStock < quantity + count) {
    //                 res.json({ success: false, message: "Quantity exceeds available stock" });
    //             } else {
    //                 const datat = await Cart.updateOne(
    //                     { userId: userId, "items.productId": proId },
    //                     {
    //                         $inc: { "items.$.quantity": count },
    //                     }
    //                 );
    //                 res.json({ changeSuccess: true });
    //             }

    //         } else {
    //             res.json({ success: false, message: "Quantity cannot be less than 1" });
    //         }


    //     } catch (error) {
    //         console.log(error);
    //         res.status(500).json({ error: 'An error occurred' });
    //     }
    // },
    // cartQuantity: async (req, res) => {
    //     try {
    //         const number = parseInt(req.body.count);
    //         const proId = req.body.product;
    //         const userId = req.body.user;
    //         const count = number;

    //         const cartData = await Cart.findOne(
    //             { userId: new ObjectId(userId), "items.productId": new ObjectId(proId) },
    //             { "items.productId.$": 1, "items.quantity": 1, subTotal: 1 }
    //         );

    //         const [{ quantity }] = cartData.items;

    //         const productData = await Product.findById(proId);

    //         // Check if the new quantity after the update will be greater than or equal to 1
    //         if (quantity + count >= 1) {
    //             if (productData.productStock < quantity + count) {
    //                 res.json({ success: false, message: "Quantity exceeds available stock" });
    //             } else {
    //                 const newQuantity = quantity + count;

    //                 if (!cartData) {
    //                     // If the cart doesn't exist, create a new one with the subTotal
    //                     const newCart = new Cart({
    //                         userId: userId,
    //                         items: [{ productId: proId, quantity: newQuantity }],
    //                     });

    //                     await newCart.save();
    //                 } else {
    //                     // Update the existing cart with the new quantity
    //                     await Cart.updateOne(
    //                         { userId: userId, "items.productId": proId },
    //                         {
    //                             $inc: { "items.$.quantity": count },
    //                         }
    //                     );


    //                     // Calculate and update the subTotal using the calculateSubTotal function
    //                     await cartData.calculateSubTotal();
    //                     await cartData.save();
    //                 }

    //                 res.json({ changeSuccess: true });
    //             }
    //         } else {
    //             res.json({ success: false, message: "Quantity cannot be less than 1" });
    //         }
    //     } catch (error) {
    //         console.log(error);
    //         res.status(500).json({ error: 'An error occurred' });
    //     }
    // },

    cartQuantity: async (req, res) => {
        try {
            const number = parseInt(req.body.count);
            const productId = req.body.product;
            const userId = req.body.user;
            const count = number;

            // Check if the cart exists
            const cartData = await Cart.findOne(
                { userId: userId, "items.productId": productId },
                { "items.$": 1, "items.quantity": 1 }
            );

            if (!cartData) {
                return res.json({ success: false, message: "Cart not found" });
            }

            const [{ quantity }] = cartData.items;

            // Check if the product exists
            const productData = await Product.findById(productId);
            if (!productData) {
                return res.json({ success: false, message: "Product not found" });
            }

            // Check if the new quantity after the update will be greater than or equal to 1
            if (quantity + count >= 1) {
                if (productData.stock < quantity + count) {
                    return res.json({ success: false, message: "Quantity exceeds available stock" });
                } else {
                    // Use findOneAndUpdate for a cleaner update
                    const updatedCart = await Cart.findOneAndUpdate(
                        { userId: userId, "items.productId": productId },
                        { $inc: { "items.$.quantity": count } },
                        { new: true } // Return the updated document
                    );

                    res.json({ changeSuccess: true, updatedCart });
                }
            } else {
                res.json({ success: false, message: "Quantity cannot be less than 1" });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'An error occurred' });
        }
    },




    removeProduct: async (req, res) => {
        try {
            console.log('apicall');
            const proId = req.body.product;
            console.log("productiddd ", proId);
            const user = req.session.userId;
            const userId = user._id;

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
    }


}