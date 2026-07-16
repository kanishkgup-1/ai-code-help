import mongoose from "mongoose";

const collabSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    code: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("CollabSession", collabSessionSchema);