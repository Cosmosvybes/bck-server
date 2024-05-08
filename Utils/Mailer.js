const mailer = require("nodemailer");
const { config } = require("dotenv");
config();
const mailTransporter = mailer.createTransport({
  service: "gmail",
  auth: {
    user: "noreply.bucksloan@gmail.com",
    pass: process.env.PASSKEY,
  },
});

const mailerSender = async (msg) => {
  const response = await mailTransporter.sendMail(msg);
  return response;
};

module.exports = { mailerSender };
