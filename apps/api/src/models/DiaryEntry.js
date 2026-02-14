const mongoose = require('mongoose');

const diaryEntrySchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  workDone: { type: String, required: true },
  hoursSpent: { type: Number, default: 0 },
  blockers: { type: String, default: '' },
  nextPlan: { type: String, default: '' },
  verifiedByMentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

diaryEntrySchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('DiaryEntry', diaryEntrySchema);
