const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authUser = async (req, res, { user, databasePassword, password, UserPasswordModel }) => {
  try {
    const isMatch = await bcrypt.compare(databasePassword.salt + password, databasePassword.password);

    if (!isMatch) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'Invalid credentials.',
      });
    }

    const payload = {
      id: user._id,
      companyId: user.companyId,
    };

    const tokenExpiryHours = req.body.remember ? 365 * 24 : 24;
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: `${tokenExpiryHours}h`,
    });

    await UserPasswordModel.findOneAndUpdate(
      { user: user._id },
      { $push: { loggedSessions: token } },
      { new: true }
    ).exec();

    const cookieOptions = {
      maxAge: req.body.remember ? 365 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 1 year or 1 day
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // only send over HTTPS in production
      sameSite: 'Strict', // CSRF protection
      domain: req.hostname,
      path: '/',
    };

    return res
      .status(200)
      .cookie('token', token, cookieOptions)
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
        message: 'User logged in successfully.',
      });

  } catch (error) {
    console.error('Auth Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Server error during authentication.',
    });
  }
};

module.exports = authUser;
