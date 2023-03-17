import { Router } from "express";
import { auth } from "../auth/jwt";
import { CafeModel, Cafe } from "../db/schema/Cafe";
import { Post, PostModel } from "../db/schema/Post";
import { UserModel, User } from "../db/schema/User";

const router = Router();

router.get("/popular", async (_, res) => {
  try {
    const result: Cafe[] = await CafeModel.aggregate([
      {
        $project: {
          owner: 1,
          cafeName: 1,
          members: 1,
          length: { $size: "$members" }
        }
      },
      {
        $sort: {
          length: -1
        }
      },
      {
        $limit: 5
      }
    ]);
    const popular = await CafeModel.populate<{ owner: User }>(result, { path: "owner" });

    res.json(popular);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const cafe = await CafeModel.findById(req.params.id).populate<{
      owner: User;
      members: User[];
      posts: Post[];
    }>(["owner", "members", "posts"]);
    if (!cafe) {
      res.sendStatus(404);
      return;
    }

    res.json(cafe);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.post("/", auth, async (req, res) => {
  const { username, cafeName } = req.body;

  try {
    const user = await UserModel.findOne({ username }).orFail(new Error("Cannot find user"));

    const cafeID = (
      await CafeModel.create({
        cafeName,
        owner: user._id
      })
    )._id;

    res.json({ id: cafeID });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.get("/search/:text", async (req, res) => {
  try {
    const result = await CafeModel.find({ cafeName: req.params.text }).populate<{ owner: User }>(
      "owner"
    );

    res.json(result);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

export default router;
