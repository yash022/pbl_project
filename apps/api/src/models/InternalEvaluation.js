const mongoose = require('mongoose');

const internalEvaluationSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  criteriaJson: { type: mongoose.Schema.Types.Mixed, default: {} },
  totalScore: { type: Number, required: true },
  remarks: { type: String, default: '' },
  locked: { type: Boolean, default: false },
}, { timestamps: true });

internalEvaluationSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('InternalEvaluation', internalEvaluationSchema);
