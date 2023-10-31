const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');



module.exports = {
    addToCart: async (req, res) => {

        try {
            // Get the product ID from the URL parameter
            const productId = req.params.id;
    
            // Get the user ID from the session (you should set this during login)
            const userId = req.session.userId;
    
            // Find the product by its ID in the database
            const product = await Product.findById(productId);
    
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
    
            // Create a new cart item or update an existing one
            let cartItem = await Cart.findOne({ userId: userId, 'items.productId': productId })

            if (cartItem) {
                // Update the quantity or any other information
                cartItem.items.quantity++;
            } else {
                // Create a new cart item
                cartItem = new Cart({
                    userId: userId,
                    items: [
                        {
                            productId: productId,
                            quantity: 1
                        }
                    ]
                });
                
            }
    
            // Save the cart item to the database
            await cartItem.save();
    
            return res.status(200).json({ message: 'Product added to cart' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error' });
        }

    },
    loadCart: async (req, res) => {
        try {
            res.render('cart')
        } catch (error) {
            console.log(error.message);
        }
    }

}