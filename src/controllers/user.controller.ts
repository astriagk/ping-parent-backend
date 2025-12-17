import { Request, Response } from "express";
import { createUser, getUsers } from "../services/user.service";

export const postUser = async (req: Request, res: Response) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  await createUser({
    name,
    email,
    createdAt: new Date(),
  });

  res.status(201).json({ message: "User created successfully" });
};

export const getAllUsers = async (_: Request, res: Response) => {
  const users = await getUsers();
  res.json(users);
};
