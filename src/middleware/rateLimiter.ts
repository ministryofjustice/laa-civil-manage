import rateLimit from "express-rate-limit";
import { config } from "#src/config.js";

export const rateLimiter = rateLimit({
  windowMs: config.RATE_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  message: `Too many requests, please try again later.`,
});
