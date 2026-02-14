const mongoose = require('mongoose');

const presentationEvaluationSchema = new mongoose.Schema({
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'PresentationSlot', required: true },
  evaluatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attendance: { type: String, default: 'PRESENT' },
  rubricJson: { type: mongoose.Schema.Types.Mixed, default: {} },
  totalScore: { type: Number, required: true },
  feedback: { type: String, default: '' },
}, { timestamps: true });

presentationEvaluationSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('PresentationEvaluation', presentationEvaluationSchema);
