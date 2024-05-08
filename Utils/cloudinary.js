const cloudinary = require("cloudinary").v2;
const { config } = require("dotenv");
config();

cloudinary.config({
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
  cloud_name: process.env.cloud_name,
});

const userVerification = async (img) => {
  try {
    const cloudResponse = cloudinary.uploader.upload(img, {
      folder: "bucksloans/users/verification",
    });
    return cloudResponse;
  } catch (error) {
    console.log(error.error);
  }
};

const paymentVerification = async (img) => {
  try {
    const cloudResponse = cloudinary.uploader.upload(img, {
      folder: "bucksloans/payment/verification",
    });
    return cloudResponse;
  } catch (error) {
    console.log(error);
  }
};

module.exports = { paymentVerification, userVerification };
