const { verifyToken } = require("../config/jwt");
const User = require("../models/User");
const Worker = require("../models/Worker");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    // console.log("Decoded token:", decoded); 

    let account = null;

    if (decoded.role === "worker") {
      account = await Worker.findById(decoded.id).select("-password");
      // console.log("Checking in Worker DB");
    } else {
      account = await User.findById(decoded.id).select("-password");
      // console.log("Checking in User DB");
    }

    if (!account) {
      // console.log("Account not found for ID:", decoded.id);
      return res
        .status(401)
        .json({ message: "Unauthorized: Account not found" });
    }

    req.user = account;
    req.user.role = decoded.role;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
};
