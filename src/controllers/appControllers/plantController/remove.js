const remove = async (Model, req, res) => {
  try {
    return res.status(404).json({
      success: false,
      message: 'You can not delete the Plant ',
    });


  } catch (error) {
    console.error('Update Admin Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }


};

module.exports = remove;
