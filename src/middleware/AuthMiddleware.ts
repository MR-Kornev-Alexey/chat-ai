import jwt, {JwtPayload} from "jsonwebtoken";
import {NextFunction, Request, Response} from "express";

interface AuthUser extends JwtPayload {
  id: string;
  email: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ status: 401, message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not defined in environment variables.");
    return res.status(500).json({ status: 500, message: "Internal Server Error" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET) as AuthUser;
    next();
  } catch (err) {
    console.error("JWT Verification Error:", err);
    return res.status(401).json({ status: 401, message: "Unauthorized: Invalid token" });
  }
};

export default authMiddleware;
