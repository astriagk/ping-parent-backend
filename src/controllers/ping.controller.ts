import { Request, Response } from "express";
import { createPing, getPings } from "../services/ping.service";

export const postPing = async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  await createPing({
    message,
    createdAt: new Date(),
  });

  res.status(201).json({ message: "Ping created successfully" });
};

export const getAllPings = async (_: Request, res: Response) => {
  const pings = await getPings();
  res.json(pings);
};
