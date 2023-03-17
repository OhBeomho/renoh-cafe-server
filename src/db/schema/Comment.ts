import mongoose, { Schema, model } from "mongoose";

const commentSchema = new Schema({
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
    ref: "User"
  }
});

export type Comment = {
  content: string;
  createDate: Date;
  writer: mongoose.Types.ObjectId;
};

export const CommentModel = model("Comment", commentSchema);
