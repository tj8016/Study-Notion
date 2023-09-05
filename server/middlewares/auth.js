const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../models/User');

// Auth
exports.auth = async (req, res, next) => {
    try {
        // extract token 
        const token = req.cookies.token || req.body.token || req.header("Authorization").replace('Bearer ', '');
        // if token is missing then return responce
        if(!token) {
            return res.status(401).json({
                success : false,
                message : "Token is missing",
            })
        }
        // verify the token
        try {
            // decode the token first 
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            // console.log(decode);
            req.user = decode;
        }catch(err) {
            // Verification issue
            return res.status(4001).json({
                success : false,
                message : 'Token is Invalid'
            })
        }
        next();
    }catch(error) {
        console.log(error);
        return res.status(500).json({
            success : false,
            message : "Something went wrong while validating the token"
        })
    }
}

// isStudent
exports.isStudent = async(req, res, next) => {
    try {
        if(req.user.role !== "Student") {
            return res.status(401).json({
                success : false,
                message : "This is protected route for student only"
            })
        }
        next();
    }catch(error) {
        return res.status(500).json({
            success : false,
            message : "User role cannot be verified, please try again"
        })
    }
}
// isInstructor
exports.isInstructor = async(req, res, next) => {
    try {
        if(req.user.role !== "Instructor") {
            return res.status(401).json({
                success : false,
                message : "This is protected route for Instructor only"
            })
        }
        next();
    }catch(error) {
        return res.status(500).json({
            success : false,
            message : "User role cannot be verified, please try again"
        })
    }
}
// isAdmin
exports.isAdmin = async(req, res, next) => {
    try {
        if(req.user.role !== "Admin") {
            return res.status(401).json({
                success : false,
                message : "This is protected route for Admin only"
            })
        }
        next();
    }catch(error) {
        return res.status(500).json({
            success : false,
            message : "User role cannot be verified, please try again"
        })
    }
}