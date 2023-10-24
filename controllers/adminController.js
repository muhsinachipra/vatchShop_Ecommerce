const Admin = require('../models/adminModel');
const User = require('../models/userModel');
const Category = require('../models/categoryModel');
const bcrypt = require('bcrypt');

const loadLogin = async (req,res)=>{
    try {
        res.render('login')
    } catch (error) {
        console.log(error.message);
    }
}



const verifyLogin = async (req,res)=>{
    try {

        const email = req.body.email
        const password = req.body.password

        const adminData = await Admin.findOne({ email:email })
        if(adminData){
            const passwordMatch = await bcrypt.compare(password,adminData.password)
            if (passwordMatch) {
                if (adminData.isAdmin === 0) {
                    res.render('login',{message:"email or password is incorrect"})
                } else {
                    req.session.admin_id = adminData._id;
                    res.redirect("/admin/dashboard")
                }
            } else {
                res.render('login',{message:"email or password is incorrect"})
            }
        }
        else{
            res.render('login',{message:"email or password is incorrect"})
        }
    } catch (error) {
        console.log(error.message);
    }
}


const loadDashboard = async(req,res)=>{
    try {
        res.render("dashboard")
    } catch (error) {
        console.log(error.message);
    }
}


const loadUsers = async(req,res)=>{
    try {
        const user= await User.find({})
        res.render("Users",{users:user})
    } catch (error) {
        console.log(error.message);
    }
}


const blockUser = async (req, res) => {
    try {
    //   const page = req.query.page || 1; // Get the current page from query parameters
    //   const pageSize = 10; // Set your desired page size
  
    const id = req.query.id;
    //   const skip = (page - 1) * pageSize;
      const user1 = await User.findById(id)

      if (user1) {
        user1.isBlocked = !user1.isBlocked
        await user1.save(); 
        
      }
  
    //   const users2 = await User.find().skip(skip).limit(pageSize);
    //   const totalUsers = await User.countDocuments();
    //   const totalPages = Math.ceil(totalUsers / pageSize);
 
      res.redirect('/admin/Users')

    } catch (error) {   
      console.log(error);   
    }
};


const loadAddCategory = async (req,res)=>{
    try {
        res.render('addCategory')
    } catch (error) {
        console.log(error.message);
    }
}


const addCategory = async (req,res)=>{
    try {
        const { categoryName } = req.body
        const already=await Category.findOne({categoryName:{$regex:categoryName,'$options':'i'}})
        if(already){
            res.render('addCategory',{message : "Category Already Created"})
        }else{
        //  const data=new Category({
        //     categoryname:categoryname,
        //     isListed:true
        //  })

        const category = await new Category({
            ...req.body,
            isListed: true
        });
          
       const result = await category.save()
       res.redirect('/admin/addCategory')
    }} catch (error) {
      console.log(error);
    }
}


const loadViewCategory = async (req,res)=>{
    try {
        const category= await Category.find({})
        res.render('viewCategory',{category:category})
    } catch (error) {
        console.log(error.message);
    }
}



const unlistCategory = async (req, res) => {
    try {
      const id = req.query.id;
      const Category1 = await Category.findById(id);
  
      if (Category1) {
        Category1.isListed = !Category1.isListed;
        await Category1.save();
      }
      res.redirect('/admin/viewCategory')
    } catch (error) {
      console.log(error);
    }
};
  

const loadEditCatogory = async (req, res) => {
    try {
      const id = req.query.id;
      const categorydata = await Category.findById(id);
  
      if (categorydata) {
        res.render('editCategory', { category: categorydata });
      } else {
        res.redirect('/admin/viewCategory');
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }
};
  

const editCategory = async (req, res) => {
    try {
      const { id, categoryName, categoryDescription } = req.body;
      await Category.findByIdAndUpdate(id, {$set:{ categoryName, categoryDescription }});
      res.redirect('/admin/viewCategory');
    } catch (error) {
      console.log(error.message);
    }
  };
  

module.exports={
    loadLogin,
    verifyLogin,
    loadDashboard,
    loadUsers,
    blockUser,
    loadAddCategory,
    addCategory,
    loadViewCategory,
    loadEditCatogory,
    unlistCategory,
    editCategory
}