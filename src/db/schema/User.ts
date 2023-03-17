import { Schema, model } from "mongoose";

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  joinDate: {
    type: Date,
    default: new Date()
  }
});

export type User = {
  username: string;
  password: string;
  joinDate: Date;
};

export const UserModel = model("User", userSchema);
