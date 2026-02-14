const mongoose = require('mongoose');

const mentorProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  specializationTags: [String],
  capacity: { type: Number, default: 10 },
  currentLoad: { type: Number, default: 0 },
  acceptingRequests: { type: Boolean, default: true },
});

mentorProfileSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('MentorProfile', mentorProfileSchema);
