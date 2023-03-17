import { genSaltSync, hashSync, compareSync } from "bcrypt";

export function hashPassword(password: string) {
  const salt = genSaltSync(10);
  return hashSync(password, salt);
}

export function comparePassword(password: string, hashedPassword: string) {
  return compareSync(password, hashedPassword);
}
