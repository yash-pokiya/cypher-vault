'use strict';
const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    color: {
      type: String,
      default: 'indigo',
      enum: ['indigo', 'rose', 'amber', 'emerald', 'sky', 'violet', 'orange', 'teal'],
    },
    icon: {
      type: String,
      default: '📁',
      maxlength: 10,
    },
    description: {
      type: String,
      default: '',
      maxlength: 200,
      trim: true,
    },
    coverFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

// One user cannot have two folders with the exact same name
folderSchema.index({ owner: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Folder', folderSchema);
