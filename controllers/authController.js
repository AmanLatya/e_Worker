const User = require("../models/User");
const Worker = require("../models/Worker");
const { signToken } = require("../config/jwt");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const { response } = require("express");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Helper function for error responses
const errorResponse = (res, status, message, error = null) => {
  console.error(message, error);
  return res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? error?.message : undefined,
  });
};

// ======================= REGISTER USER ===========================
exports.registerUser = async (req, res) => {
  console.log(req.body)
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Check password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });

    const token = signToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return errorResponse(res, 500, "User registration failed", error);
  }
};

// ======================= REGISTER WORKER ===========================
exports.registerWorker = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const existing = await Worker.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const worker = await Worker.create({
      name,
      email,
      password: hashedPassword,
      role: "worker",
    });

    const token = signToken({
      id: worker._id,
      email: worker.email,
      role: worker.role,
    });

    return res.status(201).json({
      success: true,
      token,
      worker: {
        id: worker._id,
        name: worker.name,
        email: worker.email,
        role: worker.role,
      },
    });
  } catch (error) {
    return errorResponse(res, 500, "Worker registration failed", error);
  }
};

// ======================= LOGIN ===========================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // console.log(email, " ", password)
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    // Try user first
    let account = await User.findOne({ email }).select("+password");
    let role = "user";

    if (!account) {
      account = await Worker.findOne({ email }).select("+password");
      role = "worker";
    }
    console.log(account);

    if (!account) {
      return res.status(400).json({
        success: false,
        message: "Account not found",
      });
    }

    if (!account.password) {
      return res.status(400).json({
        success: false,
        message:
          "This account uses Google Sign-In. Please sign in with Google.",
      });
    }

    const isMatch = await bcrypt.compare(password, account.password);
    console.log(isMatch);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = signToken({
      id: account._id,
      email: account.email,
      role,
    });


    if (role == "worker" && account.profile == false) {
      return res.status(403).json({
        isProfileComplete: false,
        success: true,
        token,
        role,
      });
    }
    return res.status(200).json({
      success: true,
      token,
      role,
      user: {
        id: account._id,
        name: account.name,
        email: account.email,
        role,
      },
    });
  } catch (error) {
    return errorResponse(res, 500, "Login failed", error);
  }
};

// ======================= GOOGLE AUTH ===========================
exports.googleAuth = async (req, res) => {
  try {
    const { token: googleToken, role = "user" } = req.body;

    if (!googleToken || typeof googleToken !== "string") {
      return errorResponse(res, 400, "Invalid or missing Google token");
    }

    const tokenParts = googleToken.split(".");
    if (tokenParts.length !== 3 || tokenParts.some(part => !part)) {
      return errorResponse(res, 400, "Malformed Google JWT token");
    }

    // Verify the token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, email_verified, name, sub, picture } = payload;

    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message: "Google email is not verified",
      });
    }

    let user = null;
    let isNewUser = false;

    if (role === "worker") {
      user = await Worker.findOne({ email });
    } else {
      user = await User.findOne({ email });
    }

    if (!user) {
      isNewUser = true;
      const newUser = {
        name,
        email,
        googleId: sub,
        role,
        isEmailVerified: true,
      };
      user = role === "worker"
        ? await Worker.create(newUser)
        : await User.create(newUser);
    } else if (user.googleId && user.googleId !== sub) {
      return errorResponse(res, 400, "Email already linked to another Google account");
    } else if (!user.googleId) {
      return errorResponse(res, 400, "Email registered with password. Use email login.");
    }

    const jwtToken = signToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    if (user.role == "worker" && user.profile == false) {
      return res.status(403).json({
        isProfileComplete: false,
        success: true,
        token: jwtToken,
        role,
      });
    }

    return res.status(200).json({
      success: true,
      token: jwtToken,
      isNewUser,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        picture,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return errorResponse(res, 500, "Internal server error");
  }
};

// ======================= COMPLETE WORKER PROFILE ===========================
exports.completeWorkerProfile = async (req, res) => {
  try {
    const { name, location, skill } = req.body;
    if (!name || !location || !skill) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    const workerId = req.user?._id;

    if (!workerId || req.user.role !== "worker") {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Not a worker",
      });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    if (name) worker.name = name;
    if (skill) worker.skill = skill;

    if (location) {
      const { ltd, lng } = location;
      if (typeof ltd !== "number" || typeof lng !== "number") {
        return res.status(400).json({
          success: false,
          message: "Invalid location coordinates",
        });
      }
      worker.location = {
        type: "Point",
        coordinates: [lng, ltd],
      };
      worker.profile = true
    }

    await worker.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      worker: {
        id: worker._id,
        name: worker.name,
        email: worker.email,
        skill: worker.skill,
        location: worker.location,
        profile: true
      },
    });
  } catch (error) {
    return errorResponse(res, 500, "Profile update failed", error);
  }
};

