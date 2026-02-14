const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  techStack: [String],
  maxTeamSize: { type: Number, default: 4 },
  status: { type: String, enum: ['IDEA', 'ACTIVE', 'COMPLETED', 'ARCHIVED'], default: 'IDEA' },
}, { timestamps: true });

projectSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Project', projectSchema);
