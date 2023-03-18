import { Router } from "express";
import { auth } from "../auth/jwt";
import { CafeModel } from "../db/schema/Cafe";
import { Comment, CommentModel } from "../db/schema/Comment";
import { PostModel } from "../db/schema/Post";
import { UserModel, User } from "../db/schema/User";

const router = Router();

router.get("/:id", async (req, res) => {
  try {
    const post = await PostModel.findById(req.params.id).populate<{
      writer: User;
      comments: Comment[];
    }>(["writer", "comments"]);
    if (!post) {
      res.sendStatus(404);
      return;
    }

    post.comments = (await CommentModel.populate<{ writer: User }>(post.comments, {
      path: "writer"
    })) as any[];

    res.json(post);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.post("/", auth, async (req, res) => {
  const { username, cafeID, title, content } = req.body;

  try {
    const user = await UserModel.findOne({ username }).orFail(new Error("Cannot find user"));

    const cafe = await CafeModel.findById(cafeID).orFail(new Error("Cannot find cafe"));

    if (
      cafe.owner !== user._id ||
      !cafe.members.map((value) => value.prototype).includes(user._id)
    ) {
      res.sendStatus(400);
      return;
    }

    const postID = (
      await PostModel.create({
        title,
        content,
        writer: user._id
      })
    )._id;

    await CafeModel.findByIdAndUpdate(cafeID, {
      $push: {
        posts: postID
      }
    });

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.post("/comment", auth, async (req, res) => {
  const { username, postID, content } = req.body;

  try {
    const user = await UserModel.findOne({ username }).orFail(new Error("Cannot find user"));

    const commentID = (
      await CommentModel.create({
        content,
        writer: user._id
      })
    )._id;

    await PostModel.findByIdAndUpdate(postID, {
      $push: {
        comments: commentID
      }
    });

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const exists = Boolean(await PostModel.exists({ _id: req.params.id }));
    if (!exists) {
      res.sendStatus(404);
      return;
    }

    await PostModel.findByIdAndDelete(req.params.id);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.delete("/comment/:id", auth, async (req, res) => {
  try {
    const exists = Boolean(await CommentModel.exists({ _id: req.params.id }));
    if (!exists) {
      res.sendStatus(404);
      return;
    }

    await CommentModel.findByIdAndDelete(req.params.id);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

export default router;
