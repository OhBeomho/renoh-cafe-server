import { Router } from "express";
import { comparePassword, hashPassword } from "../auth/hashPassword";
import { auth, jwtSign } from "../auth/jwt";
import { CafeModel } from "../db/schema/Cafe";
import { CommentModel } from "../db/schema/Comment";
import { PostModel } from "../db/schema/Post";
import { UserModel } from "../db/schema/User";

const router = Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await UserModel.findOne({ username });
    if (!user) {
      res.sendStatus(404);
    } else if (!comparePassword(password, user.password)) {
      res.sendStatus(401);
    } else {
      const token = jwtSign({ username, password }, "1d");
      res.json({ token });
    }
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  try {
    const exists = Boolean(await UserModel.exists({ username }));
    if (exists) {
      res.sendStatus(400);
      return;
    }

    await UserModel.create({
      username,
      password: hashPassword(password)
    });

    res.sendStatus(201);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.get("/check/:username", async (req, res) => {
  try {
    const unique = !Boolean(await UserModel.exists({ username: req.params.username }));
    res.json({ unique });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.get("/:username", async (req, res) => {
  try {
    const user = await UserModel.findOne({ username: req.params.username });
    if (!user) {
      res.sendStatus(404);
      return;
    }

    const cafeCount = (await CafeModel.find({ $or: [{ members: user._id }, { owner: user._id }] }))
      .length;
    const postCount = (await PostModel.find({ writer: user._id })).length;
    const commentCount = (await CommentModel.find({ writer: user._id })).length;

    res.json({
      username: user.username,
      joinDate: user.joinDate,
      cafeCount,
      postCount,
      commentCount
    });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.delete("/:username", auth, async (req, res) => {
  const { username, password } = req.user;

  try {
    const user = await UserModel.findOne({ username: req.params.username });
    if (!user) {
      res.sendStatus(404);
      return;
    } else if (user.username !== username || !comparePassword(password, user.password)) {
      res.sendStatus(400);
      return;
    }

    await UserModel.findByIdAndDelete(user._id);

    await CafeModel.updateMany(
      { members: user._id },
      {
        $pull: {
          members: user._id
        }
      }
    );

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

export default router;
