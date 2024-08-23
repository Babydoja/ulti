const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { registerUser, loginUser, updateUser, viewAllUser, placeOrder, changePassword, 
    resetPassword, forgotPassword, 
    deleteUser,verifyOtp,resendVerificationOtp} = require("../controller/UserController");
const auth = require("../middleware/AuthMiddleware");


// Set up Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Append the current timestamp to the file name
    }
});

const upload = multer({ storage: storage });

router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/update/:id", upload.single('profilePicture'), updateUser); // Add upload middleware for update route
router.get("/viewAllUser", viewAllUser);
router.delete("/deleteUser/:id", deleteUser);

// New route for placing an order
router.post("/order", placeOrder);
// router.post("/order", auth, placeOrder);

//password manager
router.patch('/changepassword', changePassword);
router.post('/forgotpassword', forgotPassword)
router.put('/resetpassword/:resetToken', resetPassword)

//email verification
router.post('/verifyotp',verifyOtp)
router.post('/resendverifyotp',resendVerificationOtp)
// router.get('/verify-email', emailVerification)

// protected route
router.get("/protected", auth, (req, res) => {
    res.send("This is a protected route");
});

module.exports = router;
