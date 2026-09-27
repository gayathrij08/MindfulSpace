const nodemailer = require('nodemailer');

const emailConfigLoaded = Boolean(
  process.env.EMAIL_USERNAME &&
  process.env.EMAIL_PASSWORD &&
  (process.env.EMAIL_SERVICE || process.env.EMAIL_HOST)
);

console.log('Email configuration loaded:', emailConfigLoaded);

/**
 * Send email using nodemailer
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content (optional)
 */
async function sendEmail(options) {
  if (!emailConfigLoaded) {
    console.error('Email service is not configured on the server.');
    return { success: false, code: 'not_configured', message: 'Email service is not configured on the server.' };
  }

  try {
    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development';
    let transporter;

    if (isDev && process.env.USE_TEST_EMAIL === 'true') {
      // Create a test account for development
      console.log('Creating test account for email...');
      const testAccount = await nodemailer.createTestAccount();
      
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      console.log('Using test email account:', testAccount.user);
    } else {
      // Configure real email service
      transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD.replace(/\s+/g, '')
        }
      });
    }
    
    console.log('Checking SMTP connection...');
    await transporter.verify();
    console.log('SMTP connection successful');

    // Set up email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'MindfulSpace <noreplymindfulspace.team@gmail.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };
    
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification/support email send successful');
    
    // Log email preview URL in development
    if (isDev) {
      console.log('Email sent successfully!');
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    const isAuthError = error.code === 'EAUTH' || error.responseCode === 535 || /authentication|invalid login| bad auth/i.test(error.message || '');
    const code = isAuthError ? 'authentication_failed' : 'send_failed';
    console.error(`Email service ${code}:`, error.message);
    return {
      success: false,
      code,
      message: isAuthError ? 'Email service authentication failed.' : 'Unable to send verification email.',
      error
    };
  }
}

module.exports = sendEmail;
