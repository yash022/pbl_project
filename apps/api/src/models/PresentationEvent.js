const mongoose = require('mongoose');

const presentationEventSchema = new mongoose.Schema({
  type: { type: String, enum: ['MID_SEM', 'END_SEM'], required: true },
  title: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  durationMinutes: { type: Number, default: 15 },
  createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  locked: { type: Boolean, default: false },
}, { timestamps: true });

presentationEventSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('PresentationEvent', presentationEventSchema);
