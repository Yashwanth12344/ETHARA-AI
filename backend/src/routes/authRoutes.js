const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { signup, login, getMe, seedAdmin, getAllUsers } = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/users/all', protect, getAllUsers);
// Development-only: promote an existing user to Admin using ADMIN_SECRET
router.post('/seed-admin', seedAdmin);

module.exports = router;
