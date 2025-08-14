import mongoose from "mongoose";

// Classification: productive | unproductive | neutral
const DomainSchema = new mongoose.Schema({
  domain: { type: String, unique: true },
  type:   { type: String, enum: ["productive","unproductive","neutral"], default: "neutral" }
}, { timestamps: true });

export default mongoose.model("Domain", DomainSchema);
