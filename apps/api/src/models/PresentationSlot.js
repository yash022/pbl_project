const mongoose = require('mongoose');

const presentationSlotSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'PresentationEvent', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  venue: { type: String, default: 'TBD' },
  assignedToType: { type: String, enum: ['TEAM', 'STUDENT'], default: 'TEAM' },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
});

presentationSlotSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('PresentationSlot', presentationSlotSchema);
