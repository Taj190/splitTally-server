import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    privacyMode: { type: Boolean, default: false },
    lastToggledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    toggleCount: { type: Number, default: 0 },
    lastToggleTimestamp: { type: Date },
    toggleBlockedUntil: { type: Date, default: null }
});

groupSchema.index({ members: 1 });

const Group = mongoose.model("Group", groupSchema);
export default Group;
