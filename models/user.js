'use strict';

var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    set: function(value) {
      return value.trim().toLowerCase();
    },
    validate: [
      function(email) {
        return email !== null && email.trim() !== '';
      },
      'Invalid email'
    ]
  },
  password: String,
  admin: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('User', UserSchema);
