const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authUser = async (req, res, { user, databasePassword, password, UserPasswordModel }) => {
  const isMatch = await bcrypt.compare(databasePassword.salt + password, databasePassword.password);

  if (!isMatch) {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'Invalid credentials.',
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
      maxAge: req.body.remember ? 365 * 24 * 60 * 60 * 1000 : null, // 1 year
      httpOnly: true,
      secure: false,             // false so localhost frontend can receive it (no HTTPS on localhost)
      sameSite: 'Lax',           // Lax works fine for typical frontend/backend setup
      path: '/',
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
