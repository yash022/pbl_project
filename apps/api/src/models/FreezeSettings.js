const mongoose = require('mongoose');

const freezeSettingsSchema = new mongoose.Schema({
  _id: { type: String, default: 'freeze_settings' },
  allocation: { type: Boolean, default: false },
  internalMarks: { type: Boolean, default: false },
  presentations: { type: Boolean, default: false },
});

freezeSettingsSchema.set('toJSON', {
  transform: (_, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Get or create the singleton settings document
freezeSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findById('freeze_settings');
  if (!settings) {
    settings = await this.create({ _id: 'freeze_settings' });
  }
  return settings;
};

module.exports = mongoose.model('FreezeSettings', freezeSettingsSchema);
