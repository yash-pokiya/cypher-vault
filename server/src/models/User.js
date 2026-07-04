'use strict';
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    storageUsed: { type: Number, default: 0, min: 0 },
    // ── Vault password fields ──
    vaultPasswordSet: { type: Boolean, default: false },
    vaultSalt: { type: String, default: null },
  },
  { timestamps: true, versionKey: false }
);

// Strip passwordHash from every toJSON call — server never leaks it
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
