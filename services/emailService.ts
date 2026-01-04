import nodemailer from 'nodemailer';

// Email configuration from environment variables
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'smtp';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@patenthash.com';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Patent Hash';

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransporter({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return transporter;
}

/**
 * Send OTP email to user
 */
export async function sendOTPEmail(
  email: string,
  otp: string,
  name: string
): Promise<boolean> {
  try {
    // If email is not configured, log OTP to console (development mode)
    if (!SMTP_USER || !SMTP_PASS) {
      console.log('='.repeat(60));
      console.log('📧 EMAIL SERVICE NOT CONFIGURED - DEVELOPMENT MODE');
      console.log('='.repeat(60));
      console.log(`To: ${email}`);
      console.log(`Name: ${name}`);
      console.log(`OTP Code: ${otp}`);
      console.log('='.repeat(60));
      console.log('⚠️  Configure SMTP_USER and SMTP_PASS in .env to send real emails');
      console.log('='.repeat(60));
      return true;
    }

    const mailOptions = {
      from: `"${EMAIL_FROM_NAME}" <${EMAIL_FROM}>`,
      to: email,
      subject: 'Verify Your Email - Patent Hash',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Patent Hash</h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Verify Your Email</h2>
                      <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                        Hi ${name},
                      </p>
                      <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                        Thank you for signing up! Please use the following verification code to complete your registration:
                      </p>
                      
                      <!-- OTP Code -->
                      <div style="background-color: #f9fafb; border: 2px dashed #e5e7eb; border-radius: 8px; padding: 30px; text-align: center; margin: 0 0 30px 0;">
                        <div style="font-size: 36px; font-weight: bold; color: #f97316; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                          ${otp}
                        </div>
                      </div>
                      
                      <p style="margin: 0 0 20px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                        This code will expire in <strong>5 minutes</strong>.
                      </p>
                      <p style="margin: 0 0 20px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                        If you didn't request this code, please ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;">
                        © ${new Date().getFullYear()} Patent Hash. All rights reserved.
                      </p>
                      <p style="margin: 10px 0 0 0; color: #999999; font-size: 12px; text-align: center;">
                        This is an automated email. Please do not reply.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
Hi ${name},

Thank you for signing up for Patent Hash!

Your verification code is: ${otp}

This code will expire in 5 minutes.

If you didn't request this code, please ignore this email.

© ${new Date().getFullYear()} Patent Hash. All rights reserved.
      `.trim(),
    };

    await getTransporter().sendMail(mailOptions);
    console.log(`✅ OTP email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    // In development, still return true if email is not configured
    if (!SMTP_USER || !SMTP_PASS) {
      return true;
    }
    return false;
  }
}

/**
 * Send welcome email after successful verification
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<boolean> {
  try {
    if (!SMTP_USER || !SMTP_PASS) {
      console.log(`📧 [DEV MODE] Welcome email would be sent to ${email}`);
      return true;
    }

    const mailOptions = {
      from: `"${EMAIL_FROM_NAME}" <${EMAIL_FROM}>`,
      to: email,
      subject: 'Welcome to Patent Hash!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Patent Hash</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Welcome to Patent Hash!</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Hi ${name}! 👋</h2>
                      <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                        Your email has been successfully verified! You're all set to start using Patent Hash.
                      </p>
                      <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                        Patent Hash helps you manage, protect, and verify your intellectual property using blockchain technology.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;">
                        © ${new Date().getFullYear()} Patent Hash. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    await getTransporter().sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return false;
  }
}
