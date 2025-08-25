const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { ROLE_TYPES } = require('@/config/user.config');

const authUser = async (req, res, { user, databasePassword, password, UserPasswordModel }) => {
  const isMatch = await bcrypt.compare(databasePassword.salt + password, databasePassword.password);

  if (!isMatch) {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'Invalid credentials.',
    });
  }

  // Check if user is admin/owner and email is not verified
  if (
    (user.role === ROLE_TYPES.OWNER || user.role === ROLE_TYPES.ADMIN) &&
    !databasePassword.emailVerified
  ) {
    return res.status(403).json({
      success: false,
      result: null,
      message:
        'Please verify your email before logging in. Check your inbox for verification link.',
    });
  }

  const token = jwt.sign(
    {
      id: user._id,
      companyId: user.companyId,
    },
    process.env.JWT_SECRET,
    { expiresIn: req.body.remember ? '8760h' : '24h' } // 1 year or 1 day
  );

  await UserPasswordModel.findOneAndUpdate(
    { user: user._id },
    { $push: { loggedSessions: token } },
    { new: true }
  ).exec();

  res
    .status(200)
    .cookie('token', token, {
      httpOnly: true,
      secure: true, // must be true since Render uses HTTPS
      sameSite: 'None', // must be 'None' for cross-site cookies
      maxAge: 24 * 60 * 60 * 1000, // optional
    })
    .json({
      success: true,
      result: {
        _id: user._id,
        name: user.name,
        surname: user.surname,
        role: user.role,
        email: user.email,
        photo: user.photo,
        permissions: user.permissions,
      },
      message: 'Successfully login user',
    });
};

module.exports = authUser;
