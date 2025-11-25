const ObjectId = require('mongodb').ObjectId;

const sendToken = (user, statusCode, res, verifiedDevice) => {
  const token = user.getJWTToken();

  const options = {
    expires: new Date(
      Date.now() + (parseInt(process.env.COOKIE_EXPIRE) || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };


  console.log('Device: ', verifiedDevice);
  console.log('UserID: ', user._id);

  let objectID = null;
  let deviceMatches = false;
  
  // Only check device verification if verifiedDevice exists
  if (verifiedDevice) {
    try {
      objectID = new ObjectId(verifiedDevice.split('-')[0]);
      deviceMatches = objectID.equals(user._id);
      console.log('Check Result: ', deviceMatches);
    } catch (error) {
      console.log('Device verification error: ', error.message);
      deviceMatches = false;
    }
  }


  // If 2FA is not Enabled
  if (!user.TwoFA) {
    console.log('2FA disabled - allowing login');
    res.status(statusCode)
      .cookie('token', token, options)
      .json({
        verified: true,
        user,
        token,
      });
  }
  else if (verifiedDevice && deviceMatches) {
    console.log('User And Device are Verified For Login: ', verifiedDevice);
    res.status(statusCode)
      .cookie('token', token, options)
      .json({
        verified: true,
        user,
        token,
      });
  } else {
    console.log('Please Verify Your Account For SignIn: ', verifiedDevice);
    res.status(statusCode)
      .cookie('token', token, options)
      .json({
        verified: false,
        user,
        token,
      });
  }
};

module.exports = sendToken;