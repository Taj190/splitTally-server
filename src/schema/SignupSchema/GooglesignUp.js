import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
 
  },
  email: {
    type: String,
    required:true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: false, 
  },
  googleId: {
    type: String,
    required: false, 
  },
  isGoogleSignUp: {
    type: Boolean,
    default: false,
  },
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }] ,
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Export the model
const User = mongoose.model('User', userSchema);
export default User;


  