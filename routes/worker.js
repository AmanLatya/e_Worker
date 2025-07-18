const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');
const auth = require('../middleware/auth');

router.post('/register', auth, workerController.registerOrUpdate);
router.post('/nearby', workerController.findNearby);

module.exports = router; 