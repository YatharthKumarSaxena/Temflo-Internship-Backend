const UserPasswordModel = require('@/models/userModels/UserPassword');
const bcrypt = require('bcryptjs');
const { SALT_ROUNDS } = require('@/config/security.config');

const checkPasswordIsValid = async (userId, password) => {
  const providedPassword = password;
  const userWithPassword = await UserPasswordModel.findOne({ userId: userId });
  if (!userWithPassword) return false;
  const actualPassword = userWithPassword.password;
  const isPasswordValid = await bcrypt.compare(providedPassword, actualPassword);
  return isPasswordValid;
};

const generateHash = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

module.exports = { generateHash, checkPasswordIsValid };
