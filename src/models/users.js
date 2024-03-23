const mongoose = require("mongoose");

const { Schema } = mongoose;

// Basic Schema
const BasicSchema = new Schema({
  email: {
    type: String,
    default: "",
    required: true,
    unique: true,
  },
  name: {
    type: String,
    default: "",
  },
  password: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    default: "",
  },
  city: {
    type: String,
    default: "",
  },
  party_id: {
    type: Schema.Types.ObjectId,
    ref: "party",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300,
  },
  updatedAt: {
    type: Date,
    default: "",
  },
});

module.exports = mongoose.model("users", BasicSchema);
