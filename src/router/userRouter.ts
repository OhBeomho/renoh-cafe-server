import { Router } from "express";
import { comparePassword, hashPassword } from "../auth/hashPassword";
import { jwtSign } from "../auth/jwt";
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

    res.json(user);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

export default router;
