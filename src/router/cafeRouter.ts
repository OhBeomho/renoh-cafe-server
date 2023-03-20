import { Router } from "express";
import mongoose from "mongoose";
import { auth } from "../auth/jwt";
import { CafeModel, Cafe } from "../db/schema/Cafe";
import { CommentModel } from "../db/schema/Comment";
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

    cafe.posts = (
      await PostModel.populate<{ writer: User }>(cafe.posts, {
        path: "writer"
      })
    ).sort((a, b) => b.createDate.getTime() - a.createDate.getTime()) as any[];

    res.json(cafe);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.get("/join/:id", auth, async (req, res) => {
  const { username } = req.user;

  try {
    const cafe = await CafeModel.findById(req.params.id).populate<{ owner: User; members: User[] }>(
      ["owner", "members"]
    );
    if (!cafe) {
      res.sendStatus(404);
      return;
    } else if (
      cafe.owner.username === username ||
      cafe.members.find((member) => member.username === username)
    ) {
      return;
    }

    const user = await UserModel.findOne({ username }).orFail(new Error("Cannot find user"));

    await CafeModel.findByIdAndUpdate(req.params.id, {
      $push: {
        members: user._id
      }
    });

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.get("/leave/:id", auth, async (req, res) => {
  const { username } = req.user;

  try {
    const cafe = await CafeModel.findById(req.params.id).populate<{ owner: User; members: User[] }>(
      ["owner", "members"]
    );
    if (!cafe) {
      res.sendStatus(404);
      return;
    } else if (
      cafe.owner.username === username ||
      !cafe.members.find((member) => member.username === username)
    ) {
      return;
    }

    const user = await UserModel.findOne({ username }).orFail(new Error("Cannot find user"));

    await CafeModel.findByIdAndUpdate(req.params.id, {
      $pull: {
        members: user._id
      }
    });

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.delete("/:id", auth, async (req, res) => {
  const { username } = req.user;

  try {
    const cafe = await CafeModel.findById(req.params.id).populate<{ owner: User }>("owner");
    if (!cafe) {
      res.sendStatus(404);
      return
    } else if (cafe.owner.username !== username) {
      res.sendStatus(400);
      return;
    }

    await CafeModel.findByIdAndDelete(req.params.id);
    // TODO: Delete cafe posts and comments.
    const posts = cafe.posts;
    const populatedPosts = (await CafeModel.populate<{ posts: Post[] }>(cafe, { path: "posts" })).posts;
    const comments: mongoose.Types.ObjectId[] = [];

    populatedPosts.forEach((post) => comments.push(...post.comments.map((comment) => comment._id)));

    await Promise.all([
      ...posts.map((post) => PostModel.findByIdAndDelete(post.prototype)),
      ...comments.map((comment) => CommentModel.findByIdAndDelete(comment))
    ]);

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.post("/", auth, async (req, res) => {
  const { cafeName } = req.body;
  const { username } = req.user;

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
    const result = await CafeModel.find({
      cafeName: { $regex: req.params.text, $options: "g" }
    }).populate<{ owner: User }>("owner");

    res.json(result.sort((a, b) => b.members.length - a.members.length));
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

export default router;
