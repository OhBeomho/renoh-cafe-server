import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, sign, verify } from "jsonwebtoken";

export function jwtSign(payload: { username: string; password: string }, expiresIn: string) {
  return sign(payload, String(process.env.JWT_SECRET), { expiresIn });
}

export function auth(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.headers.authorization) {
      throw new JsonWebTokenError("");
    }

    verify(req.headers.authorization, String(process.env.JWT_SECRET));
    next();
  } catch (err) {
    if ((err as Error).name === "JsonWebTokenError") {
      res.sendStatus(401);
    } else if ((err as Error).name === "TokenExpiredError") {
      res.sendStatus(419);
    }
  }
}
