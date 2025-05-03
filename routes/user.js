const router = require("express").Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt =require("jsonwebtoken");
const { authenticateToken } = require("./userAuth");

//sign up
router.post("/sign-up",async(req,res)=>{
    console.log("Route reached");
    try{
        const {username,email,contact,password,address} = req.body;
        //check username length is more than 4
        if(username.length<4){
            return res.status(400).json({message:"Username Length should be greater than 3"});
        }

        // check username already exists?
        const existingUsername = await User.findOne({username:username});
        if(existingUsername){
            return res.status(400).json({message:"Username already exists"});
        }
        const existingEmail = await User.findOne({email:email});
        if(existingEmail){
            return res.status(400).json({message:"Email already exists"});
        }
        const existingContact = await User.findOne({contact:contact});
        if(existingContact){
            return res.status(400).json({message:"Contact already exists"});
        }
        if (password.length<=5){
            return res.status(400).json({message:"Password's Length should be greater than 5"});
        }

        const hashPass = await bcrypt.hash(password,10);

        const newUser = new User({
            username:username,
            email:email,
            contact:contact,
            password:hashPass,
            address:address,


    });

    await newUser.save();
    return res.status(200).json({message:"SignUp Successfully"});
     } catch(error){
        console.error("Error during sign-up:", error);
            res.status(500).json({message:"Internal Server Error"});
        
    }

});
//sign in
router.post("/sign-in", async (req, res) => {
    console.log("Route reached");
    try {
      const { username, password } = req.body;
      const existingUser = await User.findOne({ username });
      if (!existingUser) {
        return res.status(400).json({ message: "Invalid Credentials" });
      }
  
      const isMatch = await bcrypt.compare(password, existingUser.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid Credentials" });
      }
  
      const authClaims = [
        { name: existingUser.username },
        { role: existingUser.role },
      ];
      const token = jwt.sign({ authClaims }, "bookStore123", {
        expiresIn: "30d",
      });
  
      return res.status(200).json({
        id: existingUser._id,
        role: existingUser.role,
        token: token,
      });
    } catch (error) {
      console.error("Error during sign-in:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });
  

//get-user-info
router.get("/get-user-information",authenticateToken, async(req,res)=>{
    try{
        const{id}=req.headers;
        const data=await User.findById(id).select("-password");
        return res.status(200).json(data);

    }
    catch(error){
        res.status(500).json({message:"Internal Server Error"});
    }
});
//update address
router.put("/update-address",authenticateToken,async(req,res)=>{
    try{
        const{id}=req.headers;
        const {address}=req.body;
        await User.findByIdAndUpdate(id,{address:address});
        return res.status(200).json({message: "Address Updated Successfully."});

    }
    catch(error){
        res.status(500).json({message:"Internal Server Error"});
    }

});
// Change Password Route
router.put("/change-password", authenticateToken, async (req, res) => {
    try {
      const { id } = req.headers;
      const { oldPassword, newPassword } = req.body;
  
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: "Old and new passwords are required" });
      }
  
      if (newPassword.length <= 5) {
        return res.status(400).json({ message: "New password must be longer than 5 characters" });
      }
  
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Old password is incorrect" });
      }
  
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedNewPassword;
      await user.save();
  
      return res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  
  
module.exports = router;