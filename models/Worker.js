const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, lowercase: true, required: true, unique: true },
    password: { type: String, select: false },
    googleId: { type: String },
    skill: { type: String },
    socketID: { type: String },
    location: {
      ltd: {
        type: Number,
      },
      lng: {
        type: Number,
      },
    },
    role: { type: String, default: "worker", enum: ["worker"] }, // ✅ Add this
  },
  { timestamps: true }
);

workerSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Worker", workerSchema);
