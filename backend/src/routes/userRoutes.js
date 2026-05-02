const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware.js');
const { upload } = require('../config/cloudinary.js');
const { updateProfilePicture, deleteProfilePicture, deleteMyUserAccount, updateProfile } = require('../controllers/userController.js');

router.put('/profile-picture', protect, upload.single('file'), updateProfilePicture);
router.delete('/profile-picture', protect, deleteProfilePicture);
router.put('/profile', protect, updateProfile);
router.delete('/profile', protect, deleteMyUserAccount);

module.exports = router;
