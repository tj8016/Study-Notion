const User = require('../models/User');
const OTP = require('../models/OTP');
const Profile = require('../models/Profile');
const optGenerator = require('otp-generator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mailSender = require('../utils/mailSender');
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const {creatingAccountTemplate} = require('../mail/templates/creatingAccountEmail');
require('dotenv').config();

// send Otp logic
exports.sendOTP = async (req, res) => {
    try {
        // fetch email from request body 
        const {email} = req.body;

        // check if user already exist 
        // find user with provided email
        const checkUserPresent = await User.findOne({email});

        // if user already present then return response
        if(checkUserPresent) {
            return res.status(401).json({
                success : true,
                message : "User already present"
            })
        }

        // Brute force approach to genarate otp 
        // genarate otp
        var otp = optGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets : false,
            specialChars : false,
        });
        console.log("Result is Generate OTP Func");
		console.log("OTP", otp);

        // check unique otp or not 
        const result = await OTP.findOne({otp : otp});
        while(result) {
            otp = optGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets : false,
                specialChars : false,
            });
            result = await OTP.findOne({otp : otp});
        }

        const otpPayload = {email, otp};
        
        // create and entry on db
        const otpBody = await OTP.create(otpPayload);
        console.log(otpBody);

        // return responce
        return res.status(200).json({
            success: true,
            message : 'OTP Sent Succefully',
            otp,
        });

    }catch(error) {
        // if something error occure
        console.log(error);
        return res.status(500).json({
            success : false,
            message: error.message, 
        });
    }
}

// Sing Up
exports.singUp = async(req, res) => {
    try {
        // data fetch from req body 
        const {firstName, lastName, email, password, confirmPassword, role, contactNumber, otp} = req.body;

        // validate data
        if(!firstName || !lastName || !email || !password || !confirmPassword || !role || !otp) {
            return res.status(403).json({
                success : false,
                message : "All fields are required",
            });
        }

        // password and confirm match  
        if(password !== confirmPassword) {
            return res.status(400).json({
                success : false,
                message : "Password and Confirm Password did not match",
            });
        }

        // check user already exit or not
        const exitUser = await User.findOne({email});
        if(exitUser) {
            return res.status(400).json({
                success: false,
                message : "User already registered",
            });
        }

        // find most recent otp for the user
        const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1); // this extra line is for recent entry of OTP models
        console.log(recentOtp);

        // validate otp
        if(recentOtp.length == 0) {
            return res.status(400).json({
                success : false,
                message : "OTP not Found",
            })
        }
        else if(otp !== recentOtp[0].otp) {
            // Invalid otp 
            return res.status(400).json({
                success : false,
                message : "OTP not valid",
            })
        }
        // password hash
        const hashedPassword = await bcrypt.hash(password, 10);

        // create entry on db
        // create additional profile for user
        const profileDetails = await Profile.create({
            gender:null,
            dateOfBirth : null,
            about: null,
            contactNumber: null,
        })
        // creating entry 
        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password : hashedPassword,
            role,
            additionalDetails : profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        })

        // send mail
        await mailSender(email, "Registered Successfully", creatingAccountTemplate(firstName));
        // return res
        return res.status(200).json({
            success : true,
            user,
            message : "User is registered Successfully"
        })

    }catch(error) {
        // if something error occure
        console.log(error);
        return res.status(500).json({
            success : false,
            message : "User cannot registered"
        })
    }
}

// Login 
exports.login = async (req, res) => {
    try {
        //get data from req body
        const {email, password} = req.body;

        //validate data
        if(!email || !password) {
            return res.status(403).json({
                success : false,
                message: `Please Fill up All the Required Fields`,
            })
        }
        // check user exit or not
        const user = await User.findOne({email});
        if(!user) {
            return res.status(401).json({
                success : false,
                message: `User is not Registered with Us Please SignUp to Continue`,
            })
        }

        // generate JWT after password matching
        if(await bcrypt.compare(password, user.password)) {
            const payload = {
                email : user.email,
                id : user._id,
                role : user.role,
            }
            // create token
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn : "24h"
            })
            
            // save token to user document in database
            user.token = token;
            user.password = undefined;
            // Set cookie for token and return success response
            const options = {
                expiresIn : new Date(Date.now() + 3*24*60*60*1000),
                httpOnly : true,
            }
            return res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message : "Logged in successfully"
            })
        }
        else {
            return res.status(401).json({
                success : false,
                message : "Password is incorrect"
            })
        }
        
    }catch(error) {
        return res.status(500).json({
            success : false,
            message : "Login Failed, Please try again"
        })
    }
}

// Change Password
exports.changePassword = async(req,res) => {
    try {
        // Get user data from req.user
		const userDetails = await User.findById(req.user.id);

        // Get old password, new password, and confirm new password from req.body
		const { oldPassword, newPassword, confirmNewPassword } = req.body;

        // Validate old password 
        const isPasswordMatch = await bcrypt.compare(oldPassword, userDetails.password);
        if(!isPasswordMatch) {
            // If old password does not match, return a 401 (Unauthorized) error
            return res.status(401).json({
                success : false,
                message : "The Password is incorrect"
            })
        }
    
        // validate data
        if(!newPassword || !confirmNewPassword) {
            return res.status(403).json({
                success : false,
                message : "All field are require",
            })
        }

        // newPassword and confirm password eqaul or not
        if(newPassword !== confirmNewPassword) {
            return res.status(403).json({
                success : false,
                message : "Password and Confirm Password did not matched",
            })
        }
        // hash password and update password on DB
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUserDetails = await User.findByIdAndUpdate(
			req.user.id,
			{ password: hashedPassword },
			{ new: true }
		);

        // send notification
        try {
            const emailResponce = await mailSender(
                updatedUserDetails.email, 
                passwordUpdated(
                    updatedUserDetails.email,
                    `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
                )
            )
            console.log("Email Sent Successfully : ", emailResponce.response);
        }catch(error) {
            // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
			console.error("Error occurred while sending email:", error);
			return res.status(500).json({
				success: false,
				message: "Error occurred while sending email",
				error: error.message,
			});
        }

        // return responce
        return res.status(200).json({
            success : true, 
            message : "Password updated successfully"
        })
    }catch(error) {
        // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
		console.error("Error occurred while updating password:", error);
		return res.status(500).json({
			success: false,
			message: "Error occurred while updating password",
			error: error.message,
		});
    }
}