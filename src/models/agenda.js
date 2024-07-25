const mongoose = require("mongoose");

const { Schema } = mongoose;

// Basic Schema
const BasicSchema = new Schema({
  session_id: {
    type: Schema.Types.ObjectId,
    ref: "session",
  },
  name: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  pdf_path: {
    type: String,
    default: "",
  },
  vote_state: {
    type: Number,
    default: 0,
  },
  agenda_type: {
    type: String,
    default: "pre_agenda",
    // indexedDB: true,
  },
  vote_info: {
    type: String,
    default: "",
  },
  position: {
    type: Number
  },
  voters: {
    user : {
      type : mongoose.Types.ObjectId,
      ref : "users"
    },
    decision : {
      type : Number,
    }
  },
},{timestamps:true});
  

const Agenda  = mongoose.model("agenda", BasicSchema);
module.exports = Agenda;
