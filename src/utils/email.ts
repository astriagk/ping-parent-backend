import nodemailer from "nodemailer";

export const sendVerificationEmail = async (to: string, token: string) => {
  // If no SMTP configured, log and resolve for tests/dev.
  const smtpUrl = process.env.SMTP_URL;
  const verifyLink = `${
    process.env.FRONTEND_URL || "http://localhost:3000"
  }/verify-email?token=${token}`;

  if (!smtpUrl) {
    console.log(`Verification email to ${to}: ${verifyLink}`);
    return;
  }

  const transporter = nodemailer.createTransport(smtpUrl);
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "no-reply@example.com",
    to,
    subject: "Verify your email",
    text: `Please verify your email by visiting: ${verifyLink}`,
    html: `<p>Please verify your email by visiting: <a href="${verifyLink}">${verifyLink}</a></p>`,
  });
};

export const sendPasswordResetOTP = async (to: string, otp: string) => {
  const smtpUrl = process.env.SMTP_URL;
  const text = `Your password reset code is: ${otp}. It will expire in 10 minutes.`;
  if (!smtpUrl) {
    console.log(`Password reset OTP to ${to}: ${otp}`);
    return;
  }

  const transporter = nodemailer.createTransport(smtpUrl);
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "gowtham0794k@gmail.com",
    to,
    subject: "Your password reset code",
    text,
    html: `<p>${text}</p>`,
  });
};
