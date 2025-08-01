const User = require("../models/User");
const Worker = require("../models/Worker");
const { signToken } = require("../config/jwt");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
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
    // console.log(account);
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
        message: "Profile Not Completed",
        success: true,
        token,
        role,
      });
    }
    return res.json({
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
    console.log("Google Auth Request Body:", req.body); // Debug log

    const { token: googleToken, role = "user" } = req.body;

    // Validate token presence
    if (!googleToken) {
      console.error("Google token is missing");
      return errorResponse(res, 400, "Google token is required");
    }

    // Validate token is a string
    if (typeof googleToken !== "string") {
      console.error("Google token is not a string");
      return errorResponse(res, 400, "Invalid token format");
    }

    // Validate token structure (basic JWT format check)
    const tokenParts = googleToken.split(".");
    if (tokenParts.length !== 3) {
      console.error("Invalid JWT structure - token parts:", tokenParts.length);
      return errorResponse(res, 400, "Invalid Google token structure");
    }

    // Validate each JWT part exists
    if (!tokenParts[0] || !tokenParts[1] || !tokenParts[2]) {
      console.error("Malformed JWT parts");
      return errorResponse(res, 400, "Malformed Google token");
    }

    console.log("Token format validated, verifying with Google...");

    try {
      // Verify the Google ID token
      const ticket = await googleClient.verifyIdToken({
        idToken: googleToken,
        audience: GOOGLE_CLIENT_ID, // Must match exactly
      });

      const payload = ticket.getPayload();
      console.log("Google payload:", {
        email: payload.email,
        name: payload.name,
        email_verified: payload.email_verified,
      });

      if (!payload.email_verified) {
        console.error("Google email not verified for:", payload.email);
        return res.status(400).json({
          success: false,
          message: "Google email not verified",
        });
      }

      // Check both User and Worker collections
      let user = await User.findOne({ email: payload.email })
      console.log("user - ", user)
      let isNewUser = false;

      if (!user && role === "worker") {
        user = await Worker.findOne({ email: payload.email })
        console.log("worker - ", user)
      }

      // Create new account if doesn't exist
      if (!user) {
        isNewUser = true;
        const userData = {
          name: payload.name,
          email: payload.email,
          googleId: payload.sub,
          role,
          isEmailVerified: true,
        };

        console.log("Creating new user with role:", role);
        user =
          role === "worker"
            ? await Worker.create(userData)
            : await User.create(userData);
      } else if (user.googleId && user.googleId !== payload.sub) {
        // Account exists but wasn't created with this Google account
        console.error("Google ID mismatch for:", payload.email);
        return res.status(400).json({
          success: false,
          message: "Email already registered with different Google account",
        });
      } else if (!user.googleId) {
        // Account exists but wasn't created with Google auth
        console.error("Email registered with password for:", payload.email);
        return res.status(400).json({
          success: false,
          message:
            "Email already registered with password. Please log in with password instead.",
        });
      }

      // Generate JWT token
      const jwtToken = signToken({
        id: user._id,
        email: user.email,
        role: user.role,
      });

      console.log("Authentication successful for:", user.email);

      return res.json({
        success: true,
        token: jwtToken,
        isNewUser,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          picture: payload.picture,
        },
      });
    } catch (verifyError) {
      console.error("Google token verification failed:", verifyError);
      if (verifyError.message.includes("Token used too late")) {
        return errorResponse(
          res,
          400,
          "Expired Google token. Please sign in again."
        );
      }
      return errorResponse(res, 400, "Google token verification failed");
    }
  } catch (error) {
    console.error("Google authentication error:", error);
    return errorResponse(res, 500, "Google authentication failed", error);
  }
};

// ======================= COMPLETE WORKER PROFILE ===========================
exports.completeWorkerProfile = async (req, res) => {
  try {
    const { name, location, skill } = req.body;
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

