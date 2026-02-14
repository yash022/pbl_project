const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actionType: { type: String, required: true },
  metadataJson: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

activityLogSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
