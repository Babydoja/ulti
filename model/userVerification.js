const mongoose = require("mongoose");


// Function to get current date and time in the desired format
const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString();
};

// Define the user schemas
const userVerificationSchema = mongoose.Schema({
    userId:String,
    otp:String,
    createdAt:Date,
    expiresAt:Date ,
});

// Create the user model
const userVerify = mongoose.model('Usersverification', userVerificationSchema);

module.exports = userVerify;
