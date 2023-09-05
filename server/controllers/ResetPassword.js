const User = require('../models/User');
const mailSender = require('../utils/mailSender');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Reset Password token 
exports.resetPasswordToken = async(req, res) => {
    try {
        // get email form body 
        const email = req.body.email;

        // check user for this email exist or not 
        const user = await User.findOne({email});
        if(!user) {
            return res.status(403).json({
                success : false,
                message : "User not found"
            })
        }

        // generate token
        const token = crypto.randomUUID();

        // update user by addig token and expiration time 
        const updatedDetails = await User.findOneAndUpdate({email: email}, {token : token, resetPasswordExpires : Date.now() + 5*60*1000}, {new:true});
        console.log(updatedDetails);
        // create url
        const url = `http://localhost:3000/update-password/${token}`;
        console.log("URL --->", url);
        // send mail containing the url
        await mailSender(
			email,
			"Password Reset",
			`Your Link for email verification is ${url}. Please click this url to reset your password.`
		);
        // return response
        return res.status(200).json({
            success : true,
            message : "Email sent successfully, please check email and change password",
        })
    }catch(error) {
        return res.status(500).json({
            success : false,
            message : "Somthing went wrong while sending reset password mail"
        })
    }
}

// reset Password 
exports.resetPassword = async(req, res) => {
    try {   
        const {password, confirmPassword, token} = req.body;

        // validation 
        if(!password || !confirmPassword || !token) {
            return res.status(403).json({
                success : false,
                message : "All field are require"
            })
        }

        // check password and confirmPassword equal or not 
        if(password !== confirmPassword) {
            return res.status(401).json({
                success : false,
                message : "Password and confirm Password did not match"
            })
        }

        // user exist or not using token
        const userDetails = await User.findOne({token : token});
        if(!userDetails) {
            return res.json({
                success : false,
                message : "Token is invalid"
            })
        }
        // token time check
        if(userDetails.resetPasswordExpires < Date.now) {
            return res.status(401).json({
                success : false,
                message: "Token is expired, please regenerate your token"
            })
        }

        const hashPassword = await bcrypt.hash(password, 10);

        // password update on db
        await User.findOneAndUpdate({token : token}, {password : hashPassword}, {new: true});

        // return responce 
        return res.status(200).json({
            success : true,
            message : "Password Reset Successfully",
        })
    }catch(error) {
        return res.status(500).json({
            success : false,
            message : "Somethig went wrong while Reset password"
        })
    }
}