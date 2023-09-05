const mongoose = require('mongoose');
require('dotenv').config();

const dbConnect = () => {
    mongoose.connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology:true,
    })
    .then(() => console.log('DB Connected Succesfully'))
    .catch((error) => {
        console.log('DB Connection Issue');
        console.log(error);
        process.exit(1);
    })
}

module.exports = dbConnect;