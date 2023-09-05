const nodemailer = require('nodemailer');
require('dotenv').config();

const mailSender = async(email, title, body) => {
    try {
        // 1 -> Create a Transpoter
        let transpoter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            auth : {
                user : process.env.MAIL_USER,
                pass : process.env.MAIL_PASS,
            }
        })

        // 2 -> Send the mail using Transpoter
        let responce = await transpoter.sendMail({
            from : 'StudyNotion || by TJ',
            to : `${email}`,
            subject: `${title}`,
            html : `${body}`,
        })
        console.log(responce);
        return responce;
    }catch(error) {
        console.log('Something went wrong while sending mail');
        console.log(error);
    }
}

module.exports = mailSender;