const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

function signToken(payload) {
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

function verifyToken(token) {
  return jwt.verify(token, secret);
}

module.exports = { signToken, verifyToken };
