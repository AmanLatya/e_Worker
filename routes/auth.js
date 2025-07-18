const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authVerifier = require("../middleware/auth");

router.post("/register/user", authController.registerUser);
router.post("/register/worker", authController.registerWorker);
router.post("/login", authController.login);
router.post("/google", authController.googleAuth);
router.post(
  "/completeworkerprofile",
  authVerifier,
  authController.completeWorkerProfile
);
module.exports = router;
