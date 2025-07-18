const User = require("../models/User");

exports.registerOrUpdate = async (req, res) => {
  const { name } = req.body;
  const user = req.user;
  if (user.role !== "worker") {
    return res.status(400).json({ message: "Not a worker" });
  }
  if (name) user.name = name;
  await user.save();
  res.json({ user });
};

// findNearby can be implemented with additional fields (e.g., location, skill) if needed in the future
exports.findNearby = async (req, res) => {
  const workers = await User.find({ role: "worker" }).select(
    "-password -googleId"
  );
  res.json({ workers });
};
