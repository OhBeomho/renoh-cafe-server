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

    post.comments = (
      await CommentModel.populate<{ writer: User }>(post.comments, {
        path: "writer"
      })
    ).sort((a, b) => b.createDate.getTime() - a.createDate.getTime()) as any[];

    res.json(post);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.post("/", auth, async (req, res) => {
  const { cafeID, title, content } = req.body;
  const { username } = req.user;

  try {
    const cafe = await CafeModel.findById(cafeID)
      .populate<{ owner: User; members: User[] }>(["owner", "members"])
      .orFail(new Error("Cannot find cafe"));

    if (
      cafe.owner?.username !== username &&
      !cafe.members.find((member) => member.username === username)
    ) {
      res.sendStatus(400);
      return;
    }

    const user = await UserModel.findOne({ username }).orFail(new Error("Cannot find user"));

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
  const { postID, content } = req.body;
  const { username } = req.user;

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
  const { username } = req.user;

  try {
    const post = await PostModel.findById(req.params.id).populate<{ writer: User }>("writer");
    if (!post) {
      res.sendStatus(404);
      return;
    } else if (post.writer.username !== username) {
      res.sendStatus(400);
      return;
    }

    await PostModel.findByIdAndDelete(req.params.id);
    await Promise.all(post.comments.map((comment) => CommentModel.findByIdAndDelete(comment)));

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.delete("/comment/:id", auth, async (req, res) => {
  const { username } = req.user;

  try {
    const comment = await CommentModel.findById(req.params.id).populate<{ writer: User }>("writer");
    if (!comment) {
      res.sendStatus(404);
      return;
    } else if (comment.writer.username !== username) {
      res.sendStatus(400);
      return;
    }

    await CommentModel.findByIdAndDelete(req.params.id);

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

export default router;
