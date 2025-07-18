const express = require('express');
const router = express.Router();
const requestController = require("../controllers/request-controller")
const auth = require('../middleware/auth');
const { body, query } = require('express-validator');

router.post('/create', auth,
    body('userLocation').isObject().withMessage('User location is required in the object formate'),
    // body('user').isMongoId.withMessage("Invalid user"),
    body('workerType').isIn(['carpanter', 'electrician', 'plumber']).withMessage('Worker type must be carpanter, electrician, plumber'),
    requestController.createRequest
);


router.post("/accept",
    auth,
    body('requestID').isMongoId().withMessage("Invalid ride id"),
    requestController.requestAccept
);


router.get("/confirm",
    auth,
    query('requestID').isMongoId().withMessage("Ivalid Ride ID"),
    query('otp').isNumeric().isLength({min : 6}).withMessage("OTP is 6 character"),
    requestController.confirmRequest
)


router.get("/cancel",
    auth,
    query('requestID').isMongoId().withMessage("Invalid Request ID"),
    requestController.cancelRequest
)


router.get("/complete", 
    auth,
    query('requestID').isMongoId().withMessage("Invalid Request ID"),
    requestController.requestComplete
)

router.post
module.exports = router;