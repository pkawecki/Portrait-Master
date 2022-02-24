const mongoose = require("mongoose");

const voterSchema = new mongoose.Schema({
  user: { type: String, required: true }, //user IP
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Photo" }], //Array of voters
});

module.exports = mongoose.model("Voter", voterSchema);
