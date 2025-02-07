import mongoose from 'mongoose';

const pendingInviteSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  verificationCode: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    default: () => Date.now() + 3600000, // Expires in 1 hour
    index: { expires: 0 }, // TTL Index for automatic deletion
  },
});

const PendingInvite = mongoose.model('PendingInvite', pendingInviteSchema);
export default PendingInvite;
