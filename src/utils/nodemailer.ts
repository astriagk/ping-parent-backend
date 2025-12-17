import nodemailer from "nodemailer";

export const createDevTransport = async () => {
  // If SMTP_URL provided use it, otherwise create an Ethereal test account
  const smtpUrl = process.env.SMTP_URL;
  if (smtpUrl) {
    const transporter = nodemailer.createTransport(smtpUrl);
    try {
      await transporter.verify();
      console.log("SMTP transport verified");
    } catch (e) {
      console.warn("SMTP verify failed:", e);
    }
    return transporter;
  }

  // create Ethereal account for local dev
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  console.log("Ethereal account created for dev: %s", testAccount.user);
  return transporter;
};

export default nodemailer;
