const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");

const OTPSchema = new mongoose.Schema({
    email:{
        type:String,
        required: true,
    },
    otp: {
        type:String,
        required:true,
    },
    createdAt: {
        type:Date,
        default:Date.now(),
        expires: 5*60, // The document will be automatically deleted after 5 minutes of its creation time
    }
});

// A function to send Email to the user
async function sendVerificationEmail(email, otp) {
    try {
        const mailResponse = await mailSender(
			email,
			"Verification Email",
			emailTemplate(otp)
		);
        console.log("Email send Succefully : ", mailResponse);
    }catch(error) {
        console.log("Error occured while sending mails : ", error);
        throw error;
    }
}

// pre hook to send email just before save the database
OTPSchema.pre("save", async function(next) {
    if(this.isNew) {
        await sendVerificationEmail(this.email, this.otp);
    }
    next();
})

module.exports = mongoose.model("OTP", OTPSchema);

