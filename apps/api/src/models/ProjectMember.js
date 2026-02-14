const mongoose = require('mongoose');

const projectMemberSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  memberRole: { type: String, enum: ['MENTOR', 'STUDENT'], required: true },
});

projectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });

projectMemberSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('ProjectMember', projectMemberSchema);
