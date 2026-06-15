import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
  connectionTimeout: 5000, // 5 seconds
  greetingTimeout: 5000,   // 5 seconds
  socketTimeout: 5000,     // 5 seconds
});

export const sendVerificationEmail = async (email: string, code: string): Promise<boolean> => {
  try {
    const mailOptions = {
      from: `"Qantara" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Qantara verification code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Welcome to Qantara!</h2>
          <p>Thank you for signing up. Use the following code to verify your email address:</p>
          <div style="margin: 30px 0; text-align: center;">
            <div style="display: inline-block; background-color: #f4f4f5; border: 2px dashed #d4d4d8; padding: 16px 32px; border-radius: 12px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #000;">${code}</span>
            </div>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 15 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
          <p style="color: #999; font-size: 12px;">Qantara Platform</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Nodemailer SMTP relay error caught in 24/7 isolation block:", error);
    return false;
  }
};
