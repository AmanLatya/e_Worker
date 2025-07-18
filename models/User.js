const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, select:false },
    googleId: { type: String },
    socketID:{ type: String},
    role: { type: String, default: "user", enum: ["user", "worker", "admin"] }, // ✅ Add this
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
