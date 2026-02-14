const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['STUDENT', 'MENTOR', 'PBL_FACULTY', 'ADMIN'], default: 'STUDENT' },
  department: { type: String, default: 'Unassigned' },
  semester: { type: Number, default: null },
}, { timestamps: true });

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
