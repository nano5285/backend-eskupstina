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
  party: {
    type: String,
    ref: "party",
    },
  // createdAt: {
  //   type: Date,
  //   default: Date.now,
  // },
 
  // updatedAt: {
  //   type: Date,
  //   default: "",
  // }
 },
  {timestamps:true}
);

module.exports = mongoose.model("users", BasicSchema);
