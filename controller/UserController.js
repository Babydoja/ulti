const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../model/UserModel");
const fs = require('fs');
const path = require('path');
const OrderModel = require("../model/OrderModel");
const cloudinary = require('cloudinary').v2; // Ensure you have cloudinary setup
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const userVerify = require("../model/userVerification");


// Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.EMAIL_HOST,
    auth: {
        user: process.env.EMAIL_SECRET,
        pass: process.env.PASS_SECRET
    },
    tls: {
        rejectUnauthorized: false
    }
});

// testing
transporter.verify((error, success) => {
    if (error) {
        console.log(error);
    } else {
        console.log('Ready for message');
        console.log(success);
    }
});

const registerUser = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            street,
            postcode,
            country,
            stateCounty,
            cityTown,
            age,
            sex,
            maritalStatus,
            phoneNumber,
            nationality
        } = req.body;

        // Validate required fields
        if (!firstName) return res.status(400).json({ message: "Please enter your first name" });
        if (!lastName) return res.status(400).json({ message: "Please enter your last name" });
        if (!email) return res.status(400).json({ message: "Please enter your email address" });
        if (!password) return res.status(400).json({ message: "Please enter your password" });
        if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

        // Check if email is already in use
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already in use" });

        // Hash the password
        const hashPassword = await bcrypt.hash(password, 10);

        // Create and save the new user
        const newUser = new UserModel({
            firstName,
            lastName,
            email,
            password: hashPassword,
            street,
            postcode,
            country,
            stateCounty,
            cityTown,
            age,
            sex,
            maritalStatus,
            phoneNumber,
            nationality,
            isVerified: false
        });

        const savedUser = await newUser.save();
        // Account verification
        await sendEmailVerification(savedUser, res);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const sendEmailVerification = async ({ _id, email }, res) => {
    try {
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
        const mailOptions = {
            from: process.env.EMAIL_SECRET,
            to: email,
            subject: 'Verify your email',
            html: `<p>Use the OTP <b>${otp}</b> in the app to verify your email address and complete your registration. <b>Expires in 6 hours</b>.</p>`
        };
        const saltRounds = 10;
        const hashedOTP = await bcrypt.hash(otp, saltRounds);
        const newVerify = new userVerify({
            userId: _id,
            otp: hashedOTP,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000 * 6 // 6 hours
        });

        await newVerify.save();
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Verification OTP email sent', data: { userId: _id, email } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const verifyOtp = async (req, res) => {  // Corrected function name and arguments order
    try {
        const { userId, otp } = req.body;
        if (!userId || !otp) {
            throw new Error('Empty OTP details are not allowed');
        }

        const otpVerifyRecord = await userVerify.findOne({ userId });
        if (!otpVerifyRecord) {
            throw new Error('Account record does not exist');
        }

        const { expiresAt, otp: hashedOtp } = otpVerifyRecord;
        if (expiresAt < Date.now()) {
            await userVerify.deleteMany({ userId });
            throw new Error('OTP code has expired');
        }

        const isValidOtp = await bcrypt.compare(otp, hashedOtp);
        if (!isValidOtp) {
            throw new Error('Invalid OTP code');
        }

        await UserModel.updateOne({ _id: userId }, { isVerified: true });
        await userVerify.deleteMany({ userId });

        res.status(200).json({ message: 'User email verified successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
const resendVerificationOtp = async (req, res) => {  // Corrected function name and arguments order
    try {
        const { userId, email } = req.body;
        if (!userId || !email) {
            throw new Error('Empty user details');
        }

        await userVerify.deleteMany({ userId });
        await sendEmailVerification({ _id: userId, email }, res);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// const verification = ()=>{
//     let {userId, uniqueString} = req.params
//     userVerify.find({userId})
//     .then()
//     .catch((error)=>{
//         console.log(error);
//         res.status(500).send({ error: 'Internal server error' });
//     })

// }
// const emailVerification = async (req, res) => {
//     const { token } = req.query;

//     if (!token) {
//         return res.status(400).send({ error: 'No token provided' });
//     }

//     try {
//         const user = await UserModel.findOne({ verificationToken: token });
//         if (!user) {
//             return res.status(400).send({ error: 'Invalid or expired token' });
//         }

//         user.isVerified = true;
//         user.verificationToken = undefined;
//         await user.save();

//         res.send({ message: 'Email verified successfully. You can now log in.' });
//     } catch (error) {
//         console.error('Error during email verification:', error);
//         res.status(500).send({ error: 'Internal server error' });
//     }
// };

// / Email server connection
// const server = email.server.connect({
//     user: process.env.EMAIL_SECRET,
//     password: process.env.PASS_SECRET,
//     host: process.env.EMAIL_HOST, // Use the correct host for your email service provider
//     ssl: true,
// });

// Register a new user
// const registerUser = async (req, res) => {
//     const {
//         firstName,
//         lastName,
//         email,
//         password,
//         street,
//         postcode,
//         country,
//         stateCounty,
//         cityTown,
//         age,
//         sex,
//         maritalStatus,
//         phoneNumber,
//         nationality
//     } = req.body;

//     if (!firstName) return res.status(400).json("Please enter your first name");
//     if (!lastName) return res.status(400).json("Please enter your last name");
//     if (!email) return res.status(400).json("Please enter your email address");
//     if (!password) return res.status(400).json("Please enter your password");
//     if (password.length < 6) return res.status(400).json("Password must be at least 6 characters");
//     const uniqueEmail = await UserModel.findOne({ email });
//     if (uniqueEmail) return res.status(400).json("Email already in use");

//     const hashPassword = await bcrypt.hash(password, 10);
//     const verificationToken = crypto.randomBytes(20).toString('hex');

//     const newUser = new UserModel({
//         firstName,
//         lastName,
//         email,
//         password: hashPassword,
//         street,
//         postcode,
//         country,
//         stateCounty,
//         cityTown,
//         age,
//         sex,
//         maritalStatus,
//         phoneNumber,
//         nationality,
//         verificationToken
//     });

//     await newUser.save();

//     const message = {
//         text: `Please verify your email by clicking the following link: http://localhost:8004/verify-email?token=${verificationToken}`,
//         from: process.env.EMAIL_SECRET,
//         to: newUser.email,
//         subject: 'Email Verification',
//     };

//     try {
//         await server.send(message);
//         res.status(201).send({ message: 'User registered. Please check your email to verify your account.' });
//     } catch (error) {
//         console.error('Error sending email:', error);
//         res.status(500).send({ error: 'Error sending email' });
//     }
// };

// Email verification
// const emailVerification = async (req, res) => {
//     const { token } = req.query;
//     console.log('Verification endpoint hit');

//     if (!token) {
//         return res.status(400).send({ error: 'No token provided' });
//     }

//     try {
//         const user = await UserModel.findOne({ verificationToken: token });
//         if (!user) {
//             return res.status(400).send({ error: 'Invalid or expired token' });
//         }

//         user.isVerified = true;
//         user.verificationToken = undefined;
//         await user.save();
//         res.send({ message: 'Email verified successfully. You can now log in.' });
//     } catch (error) {
//         console.error('Error during email verification:', error);
//         res.status(500).send({ error: 'Internal server error' });
//     }
//     // http://localhost:8004/api/user/verify-email?token=/6324e526d5c5e22c611566374ddd66b2e54c057d
// };

// Login a user
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email) return res.status(400).json("Please enter your email address");
    if (!password) return res.status(400).json("Please enter your password");

    const user = await UserModel.findOne({ email });
    if (!user) return res.status(400).json("Invalid email or password");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json("Invalid email or password");

    if (!user.isVerified) {
        return res.status(400).send({ error: 'Email not verified. Please check your email.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h"
    });

    res.status(200).json({ token, user });
};

// Update user
const updateUser = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            street,
            postcode,
            country,
            stateCounty,
            cityTown,
            age,
            pob,
            sex,
            maritalStatus,
            phoneNumber,
            nationality
        } = req.body;

        if (!firstName || !lastName || !email || !street || !postcode || !country || !stateCounty ||
            !cityTown || !sex || !phoneNumber) {
            return res.status(400).json("Please fill in all required fields");
        }

        let profilePicture = '';

        // Log for debugging
        console.log('Request file:', req.file);

        if (req.file) {
            try {
                const uploadProfilePicture = await cloudinary.uploader.upload(req.file.path, {
                    folder: "profilePicture",
                    resource_type: "image",
                });
                profilePicture = uploadProfilePicture.secure_url;
                console.log('Profile picture uploaded:', profilePicture);
            } catch (error) {
                console.error('Image upload error:', error);
                throw new Error("Image could not be uploaded");
            }
        }

        const hashpassword = await bcrypt.hash(password, 10);

        const updateFields = {
            firstName,
            lastName,
            email,
            street,
            postcode,
            country,
            pob,
            stateCounty,
            cityTown,
            age,
            sex,
            maritalStatus,
            phoneNumber,
            nationality,
            password: hashpassword,
            ...(profilePicture && { profilePicture }) // Update profile picture if a new one is uploaded
        };

        const updatedUser = await UserModel.findByIdAndUpdate(
            req.params.id,
            updateFields,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedUser) {
            return res.status(404).json("User not found");
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: error.message });
    }
};

// View all users
const viewAllUser = (req, res) => {
    UserModel.find()
        .then((users) => {
            console.log('Users found:', users);
            res.status(200).json(users);
        })
        .catch(error => {
            console.error('Error fetching users:', error);
            res.status(401).json('error' + error)
        });
};

const deleteUser =(async(req,res) =>{
    try {
        const {id} =req.params 
       const user = await UserModel.findByIdAndDelete(id) 
       if (!user) {
        return res.status(404).json(`no user without id :${id}`)
       }
       res.status(200).json(user)
    } catch (error) {
        res.status(500).json({msg:error.message})
    }

})

// Place a new order
const placeOrder = async (req, res) => {
    const {
        firstName,
        lastName,
        email,
        street,
        postcode,
        country,
        stateCounty,
        cityTown,
        phoneNumber,
        cartPageUrl,
        totalAmount
    } = req.body;

    try {
        const newOrder = new OrderModel({
            firstName,
            lastName,
            email,
            street,
            postcode,
            country,
            stateCounty,
            cityTown,
            phoneNumber,
            totalAmount,
            cartPageUrl,
        });

        await newOrder.save();
        res.status(200).json(newOrder);
    } catch (error) {
        console.error('Place order error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Change user password
const changePassword = async (req, res) => {
    const user = await UserModel.findById(req.user._id);

    const { oldPassword, password } = req.body;

    if (!user) {
        res.status(400);
        throw new Error('User Not Found, sign up');
    }

    // validation
    if (!oldPassword || !password) {
        res.status(400);
        throw new Error('Please add old and new password');
    }

    // Check if old password matches password in DB
    const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

    // Save new password 
    if (user && passwordIsCorrect) {
        user.password = await bcrypt.hash(password, 10);
        await user.save();
        res.status(200).send('Password change successful');
    } else {
        res.status(404);
        throw new Error('Old password is incorrect');
    }
};

// Forgot password
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
        res.status(404);
        throw new Error('User does not exist');
    }

    // Delete token if token exists
    let token = await Token.findOne({ userId: user._id });
    if (token) {
        await token.deleteOne();
    }

    // Create reset token
    let resetToken = crypto.randomBytes(32).toString('hex') + user._id;

    // Hash token before saving to DB
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save token to DB
    await new Token({
        userId: user._id,
        token: hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * (60 * 1000) // 30 minutes
    }).save();

    // Construct reset URL
    const resetURL = `${process.env.CLIENT_URL}/resetpassword/${resetToken}`;

    // Construct reset email
    const message = `
        <h2>Hello ${user.name}</h2>
        <p>Please use the URL below to reset your password</p>
        <p>The reset link is only valid for 30 minutes</p>
        <a href=${resetURL} clicktracking=off>${resetURL}</a>
        <p>Regards,</p>
        <p>Your Company</p>
    `;

    const subject = "Password Reset Request";
    const send_to = user.email;
    const sent_from = process.env.EMAIL_USER;

    try {
        await sendMail(subject, message, send_to, sent_from);
        res.status(200).json({ success: true, message: "Reset Email Sent" });
    } catch (error) {
        res.status(500);
        throw new Error("Email not sent, please try again later");
    }
};

// Reset password
const resetPassword = async (req, res, next) => {
    const { password } = req.body;
    const { resetToken } = req.params;

    // Hash token, then compare to Token in DB
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Find token in DB
    const userToken = await Token.findOne({
        token: hashedToken,
        expiresAt: { $gt: Date.now() },
    });

    if (!userToken) {
        res.status(404);
        throw new Error("Invalid or Expired Token"); 
    }
    // Find user
    const user = await UserModel.findOne({ _id: userToken.userId });
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.status(200).json({
        message: "Password Reset Successful, Please Login",
    });
};


module.exports = { registerUser, loginUser, updateUser, deleteUser,viewAllUser,verifyOtp,resendVerificationOtp, sendEmailVerification,  placeOrder, changePassword, forgotPassword, resetPassword,  };
