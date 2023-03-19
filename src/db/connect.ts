import "dotenv/config";
import mongoose from "mongoose";

export default async function connect() {
  if (!process.env.DB_URI) {
    throw new Error("DB_URI 환경변수를 설정해 주세요.");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(process.env.DB_URI, {
    dbName: process.env.NODE_ENV || "dev"
  });

  console.log("DB에 연결되었습니다.");
}
