import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback-secret-change-in-production";

export interface JWTPayload {
  id: string;
  email: string;
  role: Role;
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};
