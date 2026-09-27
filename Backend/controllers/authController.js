const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/emailService');
const TrustedContact = require('../models/TrustedContact');

const trustedContactEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const trustedContactPhonePattern = /^\+?[0-9\s().-]{8,25}$/;
const userEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Register user
exports.register = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      mobile,
      dob,
      password,
      trustedContact
    } = req.body;

    const hasTrustedContact = trustedContact && Object.values(trustedContact).some(value => value !== '' && value !== undefined && value !== null);
    if (!firstName || !lastName || !email || !mobile || !dob || !password) {
      return res.status(400).json({ success: false, message: 'All required account fields must be provided' });
    }
    if (!userEmailPattern.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }
    if (!trustedContactPhonePattern.test(mobile)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid mobile number' });
    }
    if (hasTrustedContact) {
      if (!trustedContact.name || !trustedContact.relationship || !trustedContact.phone || !trustedContact.email) {
        return res.status(400).json({ success: false, message: 'Complete trusted contact details are required' });
      }
      if (!trustedContactPhonePattern.test(trustedContact.phone)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid trusted contact phone number' });
      }
      if (!trustedContactEmailPattern.test(trustedContact.email)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid trusted contact email address' });
      }
      if (trustedContact.emergencyAlertConsent !== true) {
        return res.status(400).json({ success: false, message: 'Trusted contact alert consent must be explicitly enabled' });
      }
    }
    
    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { mobile }] });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or mobile already exists'
      });
    }
    
    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      mobile,
      dob,
      password
    });

    if (hasTrustedContact) {
      await TrustedContact.create({
        user: user._id,
        name: trustedContact.name,
        relationship: trustedContact.relationship,
        phone: trustedContact.phone,
        email: trustedContact.email,
        emergencyAlertConsent: true
      });
    }
    
    // Generate OTP
    const otp = user.generateOTP();
    await user.save();
    
    // Development mode - bypass email for testing
    const isDev = process.env.NODE_ENV === 'development';
    const bypassEmail = process.env.DEV_OTP_BYPASS === 'true';
    
    if (isDev && bypassEmail) {
      console.log('DEVELOPMENT MODE: Bypassing email for testing');
      return res.status(503).json({
        success: false,
        message: 'We could not send the verification email. Please try again after the email service is configured.',
        emailDelivery: 'not_configured'
      });
    }
    
    // Create HTML template for OTP email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4073c0;">MindfulSpace</h1>
        </div>
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333;">Verify Your Account</h2>
          <p>Thank you for registering with MindfulSpace. To complete your registration, please use the following OTP code:</p>
          <div style="background-color: #f5f7fa; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0; font-weight: bold; color: #4073c0;">
            ${otp}
          </div>
          <p>This code is valid for 10 minutes and can only be used once.</p>
        </div>
        <div style="color: #666; font-size: 14px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
          <p>If you didn't request this email, please ignore it.</p>
          <p>© ${new Date().getFullYear()} MindfulSpace. All rights reserved.</p>
        </div>
      </div>
    `;
    
    try {
      // Send OTP via email
      const emailResult = await sendEmail({
        to: email,
        subject: 'MindfulSpace Account Verification',
        text: `Your verification OTP is: ${otp}. This OTP is valid for 10 minutes.`,
        html: htmlContent
      });
      
      if (!emailResult.success) {
        // Email failed to send
        console.error('Failed to send verification email:', emailResult.message);
        return res.status(502).json({
          success: false,
          message: 'We could not send the verification email. Please try again.',
          emailDelivery: emailResult.code || 'send_failed',
          registrationCreated: true,
          canResend: true
        });
      }
      
      // Email sent successfully
      res.status(201).json({
        success: true,
        message: 'Verification email sent successfully. Please enter the OTP sent to your email.'
      });
      
    } catch (error) {
      console.error('Email error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'We could not send the verification email. Please try again.',
        emailDelivery: 'send_failed',
        registrationCreated: true,
        canResend: true
      });
    }
  } catch (error) {
    console.error('Registration error:', error.message);
    next(error);
  }
};

// Verify OTP
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    
    // Hash the received OTP
    const hashedOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');
    
    // Find user with matching OTP and valid expiry
    const user = await User.findOne({
      email,
      verificationToken: hashedOTP,
      verificationExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }
    
    // Mark user as verified
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpire = undefined;
    await user.save();
    
    // Generate token and send response
    const token = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      message: 'Account verified successfully',
      token
    });
  } catch (error) {
    next(error);
  }
};

// Resend OTP
exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account already verified'
      });
    }
    
    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();
    
    // Send OTP via email
    try {
      const emailResult = await sendEmail({
        to: email,
        subject: 'MindfulSpace Account Verification - New OTP',
        text: `Your new verification OTP is: ${otp}. This OTP is valid for 10 minutes.`
      });

      if (!emailResult.success) {
        return res.status(502).json({
          success: false,
          message: 'We could not send the verification email. Please try again.',
          emailDelivery: emailResult.code || 'send_failed'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'New OTP sent successfully'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Could not send verification email'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if user is verified
    if (!user.isVerified) {
      // Generate new OTP
      const otp = user.generateOTP();
      await user.save();
      
      // Send OTP via email
      const emailResult = await sendEmail({
        to: email,
        subject: 'MindfulSpace Account Verification',
        text: `Your verification OTP is: ${otp}. This OTP is valid for 10 minutes.`
      });

      if (!emailResult.success) {
        return res.status(502).json({
          success: false,
          message: 'We could not send the verification email. Please try again.',
          emailDelivery: emailResult.code || 'send_failed'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Account not verified. A new OTP has been sent to your email.'
      });
    }
    
    // Generate token and send response
    const token = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// Forgot password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account with that email address exists'
      });
    }
    
    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save();
    
    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    
    // Send email
    try {
      await sendEmail({
        to: email,
        subject: 'MindfulSpace Password Reset',
        text: `You requested a password reset. Please go to this link to reset your password: ${resetUrl}
        
        If you didn't request this, please ignore this email.`
      });
      
      res.status(200).json({
        success: true,
        message: 'Password reset link sent to your email'
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Could not send reset email'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');
    
    // Find user with token
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
    
    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
};
