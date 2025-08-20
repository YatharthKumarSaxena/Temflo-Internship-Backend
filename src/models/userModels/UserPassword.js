const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const UserPasswordSchema = new Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, unique: true },
  password: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return v && v.length >= 8;
      },
      message: 'Password must be at least 8 characters long.',
    },
  },
  salt: {
    type: String,
    required: true,
  },
  emailToken: {
    token: String,
    created: Date,
  },
  resetToken: {
    token: String,
    created: Date,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  authType: {
    type: String,
    default: 'email',
  },
  loggedSessions: {
    type: [String],
    default: [],
  },
});

// generating a hash
UserPasswordSchema.methods.generateHash = function (salt, password) {
  return bcrypt.hashSync(salt + password);
};

// checking if password is valid
UserPasswordSchema.methods.validPassword = function (salt, userpassword) {
  return bcrypt.compareSync(salt + userpassword, this.password);
};

module.exports = mongoose.model('UserPassword', UserPasswordSchema);
