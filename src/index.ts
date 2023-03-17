import "dotenv/config";
import express from "express";
import cors from "cors";
import connect from "./db/connect";
import cafeRouter from "./router/cafeRouter";
import postRouter from "./router/postRouter";
import userRouter from "./router/userRouter";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/cafe", cafeRouter);
app.use("/post", postRouter);
app.use("/user", userRouter);

connect()
  .then(() =>
    app.listen(Number(process.env.PORT || 5000), () =>
      console.log("서버가 시작되었습니다. PORT: " + (process.env.PORT || 5000))
    )
  )
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
