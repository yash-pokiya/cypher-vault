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
    vaultVerifier: { type: String, default: null },

    // ── Envelope Encryption: server stores ONLY the wrapped (encrypted) MasterKey ──
    // The plaintext MasterKey NEVER touches the server. The wrappedMasterKey can only
    // be unwrapped client-side using a KEK derived from the user's vault password.
    wrappedMasterKey: { type: String, default: null },
    keyVersion: { type: Number, default: 1 },
    encryptionMetadata: {
      algorithm:      { type: String, default: 'AES-KW' },
      kdfIterations:  { type: Number, default: 600000 },
      kdfHash:        { type: String, default: 'SHA-256' },
      masterKeyAlg:   { type: String, default: 'AES-KW' },
      masterKeyLength:{ type: Number, default: 256 },
      createdAt:      { type: Date, default: null },
      updatedAt:      { type: Date, default: null },
    },
    // ── Server-Side Vault Unlock Rate Limiting & Lockout ──
    vaultUnlockSecurity: {
      failedAttempts:       { type: Number, default: 0 },
      lockUntil:            { type: Date, default: null },
      lastFailedAttempt:    { type: Date, default: null },
      lastSuccessfulUnlock: { type: Date, default: null },
    },
  },
  { timestamps: true, versionKey: false }
);

// Strip passwordHash from every toJSON call — server never leaks it
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

// Ensure storageUsed is never negative before validation and save
userSchema.pre('validate', function (next) {
  if (typeof this.storageUsed === 'number' && this.storageUsed < 0) {
    this.storageUsed = 0;
  }
  next();
});

userSchema.pre('save', function (next) {
  if (typeof this.storageUsed === 'number' && this.storageUsed < 0) {
    this.storageUsed = 0;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);