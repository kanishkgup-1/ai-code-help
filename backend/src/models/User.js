import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    tier: { type: String, enum: ["free", "pro"], default: "free" },
    passwordHash: { type: String, required: true, select: false }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
