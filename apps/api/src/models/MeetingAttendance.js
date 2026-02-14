const mongoose = require('mongoose');

const meetingAttendanceSchema = new mongoose.Schema({
  meetingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['PRESENT', 'ABSENT', 'LATE'], default: 'PRESENT' },
});

meetingAttendanceSchema.index({ meetingId: 1, studentId: 1 }, { unique: true });

meetingAttendanceSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('MeetingAttendance', meetingAttendanceSchema);
