const express = require('express');
const router = express.Router();
const meController = require('../controllers/meController');
const auth = require('../middleware/auth');

router.get('/', auth, meController.getMe);

module.exports = router; 