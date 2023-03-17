import mongoose, { Schema, model } from "mongoose";

const cafeSchema = new Schema({
  cafeName: {
    type: String,
    required: true
  },
  members: [{ type: mongoose.Types.ObjectId, ref: "User" }],
  posts: [{ type: mongoose.Types.ObjectId, ref: "Post" }],
  createDate: {
    type: Date,
    default: new Date()
  },
  owner: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true
  }
});

export type Cafe = {
  cafeName: string;
  members: mongoose.Types.ObjectId[];
  posts: mongoose.Types.ObjectId[];
  createDate: Date;
  owner: mongoose.Types.ObjectId;
};

export const CafeModel = model("Cafe", cafeSchema);
