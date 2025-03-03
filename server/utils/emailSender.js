const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Creates an email transporter using environment variables or falls back to test account
 * @returns {Promise<nodemailer.Transporter>} Configured email transporter
 */
async function createTransporter() {
  // Use environment variables if available
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      // Add this for STARTTLS support
      requireTLS: true,
      tls: {
        ciphers: 'SSLv3'
      }
    });
  } else {
    // Fallback to test account
    console.log('No email credentials found, using test account');
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('Test email credentials:', {
      user: testAccount.user,
      preview: 'https://ethereal.email'
    });
    return transporter;
  }
}

/**
 * Sends a thank you email to survey respondents
 * @param {string} name - Respondent's name
 * @param {string} email - Respondent's email address
 * @param {object} options - Additional options
 * @param {string} options.surveyTitle - Title of the survey
 * @param {object[]} options.answers - Survey answers (optional)
 * @returns {Promise<object>} Result of the email sending operation
 */
async function sendThankYouEmail(name, email, options = {}) {
  try {
    const transporter = await createTransporter();
    
    // Current timestamp and additional options
    const timestamp = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const surveyTitle = options.surveyTitle || 'Career Readiness Survey';
    const username = 'penguince';
    
    const mailOptions = {
      from: `"Career Services" <${process.env.EMAIL_USER || 'career-survey@example.com'}>`,
      to: email,
      subject: `Thank You for Completing Our ${surveyTitle}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Thank You for Your Survey Response</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
            <!-- Header -->
            <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border-radius: 5px 5px 0 0;">
              <h1 style="color: #4a86e8; margin: 0; font-size: 24px;">Thank You!</h1>
              <p style="margin: 5px 0 0 0; color: #666;">Your feedback is important to us</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 20px; background-color: #ffffff;">
              <p>Hello <strong>${name}</strong>,</p>
              <p>Thank you for taking the time to complete our <strong>${surveyTitle}</strong> on ${formattedDate}.</p>
              <p>Your insights are invaluable and will help us better understand career preparation needs and improve our services.</p>
              
              <div style="margin: 25px 0; padding: 15px; background-color: #e8f4fe; border-left: 4px solid #4a86e8; border-radius: 3px;">
                <p style="margin-top: 0;"><strong>What's next?</strong></p>
                <p>Our team carefully reviews all submissions to identify trends and areas where we can enhance our career support services.</p>
                <p style="margin-bottom: 0;">We may reach out with additional resources tailored to your career interests.</p>
              </div>
              
              <p>If you have any questions or need career guidance, please don't hesitate to contact our career services team.</p>
            </div>
            
            <!-- Call to Action -->
            <div style="text-align: center; padding: 20px;">
              <a href="https://example.com/career-resources" 
                 style="display: inline-block; padding: 10px 20px; background-color: #4a86e8; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Explore Career Resources
              </a>
            </div>
            
            <!-- Footer -->
            <div style="padding: 20px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eaeaea;">
              <p>Best regards,<br><strong>Career Services Team</strong></p>
              <p style="margin-top: 20px;">© 2025 Career Services Department</p>
              <p>Timestamp: ${timestamp} | Ref: ${username}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    
    // For Ethereal Email accounts, display preview URL
    if (info.messageId && info.envelope) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('Preview URL:', previewUrl);
      }
    }
    
    return {
      success: true,
      messageId: info.messageId,
      timestamp: timestamp
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { sendThankYouEmail };