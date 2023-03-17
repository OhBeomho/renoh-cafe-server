import mongoose, { Schema, model } from "mongoose";

const postSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createDate: {
    type: Date,
    default: new Date()
  },
  writer: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "User"
  },
  comments: [{ type: mongoose.Types.ObjectId, ref: "Comment" }]
});

export type Post = {
  title: string;
  content: string;
  createDate: Date;
  writer: mongoose.Types.ObjectId;
  comments: mongoose.Types.ObjectId[];
};

export const PostModel = model("Post", postSchema);
