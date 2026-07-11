import mongoose from "mongoose";
import env from "./env.js";

export async function connectToDatabase() {
  if (!env.mongoUri) {
    throw new Error("MONGODB_URI must be set to start the API.");
  }

  await mongoose.connect(env.mongoUri);
  console.log("Connected to MongoDB.");
}
