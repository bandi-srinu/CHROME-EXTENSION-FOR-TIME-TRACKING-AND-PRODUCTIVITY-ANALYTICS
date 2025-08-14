import mongoose from "mongoose";

// One document per domain per day, accumulating seconds.
const EntrySchema = new mongoose.Schema({
  domain: { type: String, index: true },
  date:   { type: String, index: true }, // YYYY-MM-DD
  seconds:{ type: Number, default: 0 }
}, { timestamps: true });

EntrySchema.index({ domain: 1, date: 1 }, { unique: true });

export default mongoose.model("Entry", EntrySchema);
