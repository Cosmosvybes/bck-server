const { newCustomer, getCustomer } = require("../Model/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { mailerSender } = require("../Utils/Mailer");
const {
  userVerification,
  paymentVerification,
} = require("../Utils/cloudinary");
const { newVerification } = require("../Model/Verification");
const {
  depositWithCard,
  addCardPhotos,
  makeDownPayment,
  approveUser,
  getLoanApplication,
  updateUserAddress,
  approveDownPayment,
  rejectDownPayment,
  changePassword,
  addNewPassword,
} = require("../Controller/main");
const { getLoan, approveLoanRequest } = require("../Model/Loan");

const signUp = async (req, res) => {
  const { firstname, lastname, email, phone, password } = req.body;
  try {
    const isRegisteredUser = await getCustomer(email);
    if (isRegisteredUser) {
      res
        .status(403)
        .send({ response: "user exist, sign in or try new e-mail" });
      return;
    }
    const serverResponse = await newCustomer(
      firstname.toLowerCase(),
      lastname.toLowerCase(),
      phone,
      email.toLowerCase(),
      password
    );
    const code = Date.now();
    const verificationCode = String(code).slice(7, 15);
    const mail = {
      from: '"Bucksloan US"  <noreply@bucksloan@gmail.com>',
      to: email,
      subject: " Welcome to Bucksloan! 🎉 Let's Get Started!",
      html: `<p>Dear ${firstname},</p>
      <p>Welcome aboard to Bucksloan! We're thrilled to have you join our community of savvy borrowers. Whether you're seeking financial support for a personal project, investment opportunity, or unexpected expenses, we're here to guide you through every step of the borrowing process.</p>
      <p>We're committed to your financial well-being and success. As you embark on this journey with us, we're here to support you every step of the way.
      Once again, welcome to the bucksloan family! We look forward to serving you and helping you achieve your financial goals.</p>
      <p>As part of our secuirty measures, we require a 2-factor authentication (2FA) process to ensure your account is safe and secure. Please find your 2FA code below.</p>
      <p style="font:italic;">2FA code  ${verificationCode}</p>
      <p>Best regards,</p>
      <p>The bucksloan team.</p>`,
    };

    const token = jwt.sign(
      { Two_Fa: { verificationCode } },
      process.env.api_secret
    );
    res.cookie("Two_Fa", token, {
      maxAge: 36000000,
      path: "/api/verify",
      sameSite: "None",
      secure: true,
      httpOnly: true,
    });

    const userToken = jwt.sign(
      { payload: email.toLowerCase() },
      process.env.api_key
    );
    res.cookie("userToken", userToken, {
      maxAge: 360000000,
      path: "/api",
      sameSite: "None",
      secure: true,
      httpOnly: true,
    });
    res.status(200).send({
      response: "Two-factor authentication code sent to your e-mail",
      token,
      userToken,
    });
    if (serverResponse) {
      await mailerSender(mail);
    }
  } catch (error) {
    res.send({ response: "Server  currently unavailable, try again" });
  }
};

const signIn = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existUser = await getCustomer(email.toLowerCase());
    if (existUser) {
      const isValid = await bcrypt.compare(password, existUser.password);
      if (!isValid) {
        res.status(200).send({ response: "Incorrect password" });
      } else {
        const userToken = jwt.sign(
          { payload: existUser.email },
          process.env.api_key
        );
        res.cookie("userToken", userToken, {
          maxAge: 360000000,
          path: "/api/",
          sameSite: "None",
          secure: true,
          httpOnly: true,
        });
        const code = Date.now();
        const verificationCode = String(code).slice(7, 15);
        const mail = {
          from: '"Bucksloan US"  <no-reply@bucksloan@gmail.com>',
          to: email,
          subject: "Two-Factor Authentication",
          html: `<p>Hey ${email}</p>
          <p>A sign in attempt requires your futher verification because we did recognize your device. To complete the sign in, enter the verification code.</p>
          <p>Verification code: ${verificationCode}</p>
          <p>Thanks,</p>
          <p>The bucksloan team.</p>`,
        };

        await mailerSender(mail);
        const token = jwt.sign(
          { Two_Fa: { verificationCode, email } },
          process.env.api_secret
        );

        res.cookie("Two_Fa", token, {
          maxAge: 36000000,
          path: "/api/verify",
          sameSite: "strict",
          secure: true,
          httpOnly: true,
        });
        res.status(200).send({
          response: "account logged in successfully",
          isAuthorised: true,
          token,
          userToken,
        });
      }
    } else {
      res.status(403).send({ response: "Forbidden, user not found" });
    }
  } catch (error) {
    console.log({ error });
  }
};

const _2faAUth = async (req, res) => {
  const _2faCode = req.user.Two_Fa.verificationCode;
  let email = req.user.Two_Fa.email;

  const { userCode } = req.body;
  try {
    if (_2faCode == userCode) {
      res.status(200).send({
        response: "User Authenticated , thank you!",
        isAUthenticated: true,
        user: await getCustomer(email),
      });
    } else {
      res
        .status(200)
        .send({ response: "Code does not match", isAUthenticated: false });
    }
  } catch (error) {
    res.status(500).send({ response: "internal server error" });
  }
};

const identityUpload = async (req, res) => {
  const { identityType, ssn } = req.body;
  const email = req.user.payload;
  const user = await getCustomer(email);
  let firstname = user.firstname;
  let lastname = user.lastname;
  let userEmail = user.email;
  let client = { firstname, lastname };
  const image = req.file;
  try {
    const imageFiles = [];
    imageFiles.push(image.path);
    imageFiles.push(req.body.image);
    const uploadedImages = [];
    for (let i = 0; i < imageFiles.length; i++) {
      let response = await userVerification(imageFiles[i]);
      uploadedImages.push(response.secure_url);
    }
    if (uploadedImages.length > 1) {
      const response = await newVerification(
        client,
        userEmail,
        identityType,
        uploadedImages,
        ssn
      );
      const mail = {
        from: '"Bucksloan US"  <no-reply@bucksloan@gmail.com>',
        to: userEmail,
        subject: "Confirmation: User ID Documents Received",
        html: `<p>Dear ${firstname},</p>
        <p>I hope you're well. I wanted to confirm that we've received your user identification documents. Thank you for your prompt action.</p>
        <p>Rest assured, we're now reviewing them. If we need any further information, we'll reach out to you immediately.</p>
        <p>Thanks again for your cooperation.
        </p>
        <p>Best regards,</p>
        <p>The bucksloan team</p>`,
      };
      const adminMail = {
        from: '"Bucksloan US"  <no-reply@bucksloan@gmail.com>',
        to: "alfredchrisayo@gmail.com",
        subject: "Confirmation: User ID Documents Received",
        html: `<p>Dear ${firstname},</p>
        <p>I hope you're well. I wanted to confirm that a user has submitted identification documents.</p>
        <p>Best regards,</p>
        <p>The bucksloan team</p>`,
      };
      await mailerSender(mail);
      await mailerSender(adminMail);
      res.status(200).send({
        response: "Document is being submitted for review",
        responseId: response.insertedId,
      });
    }
  } catch (error) {
    res.status(503).send({ response: "Internal error, operation failed" });
  }
};
const userProfile = async (req, res) => {
  const userEmail = req.user.payload;
  try {
    const userACcount = await getCustomer(userEmail);
    res.status(200).send({ userACcount });
  } catch (error) {
    res.status(500).send({ error });
  }
};
const addDownPayment = async (req, res) => {
  const cardDetails = req.body;
  cardDetails.photos = [];
  const email = req.user.payload;

  try {
    const userData = await depositWithCard(email, cardDetails);
    if (userData.modifiedCount == 1) {
      res.status(200).send({
        response: cardDetails.id,
      });
    } else {
      res.status(403).send({ response: "Forbbidden, try again" });
    }
  } catch (error) {
    res.status(500).send({ response: "Service unavailable" });
  }
};

const uploadCardPhotos = async (req, res) => {
  const email = req.user.payload;
  const photos = req.files;
  console.log(photos);
  const { id } = req.body;
  try {
    let photos_Url = [];
    for (let i = 0; i < photos.length; i++) {
      const secure_url = await paymentVerification(photos[i].path);
      photos_Url.push(secure_url.secure_url);
    }
    const response = await addCardPhotos(email, photos_Url, id);
    console.log(response);
    if (response.insertedId) {
      const mail = {
        from: '"Bucksloan US"  <no-reply@bucksloan@gmail.com>',
        to: "alfredchrisayo@gmail.com",
        subject: "CLIENT MADE A DEPOSIT",
        html: `<p>Dear admin,</p>
        <p>Client has initiated a deposit,check in.</p>
        <p>Best regards,</p>
        <p>The bucksloan team</p>`,
      };
      await mailerSender(mail);
      res.status(200).send({ response: "Card successfully linked" });
    } else {
      res.status(200).send({ response });
    }
  } catch (error) {
    res.status(500).send({ response: "Internal error" });
  }
};

const addCryptoPaymentReciept = async (req, res) => {
  const { amount } = req.body;
  const photo = req.file;
  const user = req.user.payload;
  const paymentDetails = { amount };
  try {
    const cloudinaryResponse = await paymentVerification(photo.path);
    if (cloudinaryResponse.secure_url) {
      paymentDetails.photo = cloudinaryResponse.secure_url;
      const response = await makeDownPayment(user, paymentDetails);
      if (response.insertedId) {
        res.status(200).send({
          response: "Payment succesfully submitted",
          paymentIsSubmitted: true,
        });
      }
    }
  } catch (error) {
    res.status(500).send({ response: "internal server error,try again." });
  }
};

const loanApplication = async (req, res) => {
  const loanData = req.body;
  const user = req.user.payload;
  try {
    const response = await getLoan(user, loanData);
    if (response.modifiedCount || response.matchedCount) {
      res
        .status(200)
        .send({ response: "Loan application successfully submitted" });
    } else {
      res.status(403).send({ response: response });
    }
  } catch (error) {
    res.status(500).send({ response: "internal server error", error });
  }
};

const approveLoan = async (req, res) => {
  let id = req.params.id;
  let user = req.query.email;
  try {
    let response = await approveLoanRequest(user, id);
    if (response.matchedCount === 1) {
      res
        .status(200)
        .send({ response: "Loan application successfully approved" });
      return;
    }
    res.status(403).send({ response: "request forbidden" });
  } catch (error) {
    res.status(500).send({ response: "internal server error", error });
  }
};

const approveUserIdentity = async (req, res) => {
  const user = req.params.user;

  try {
    const response = await approveUser(user);
    if (response.isDisapproved) {
      res.status(202).send({ response: "User identity disapproved" });
      return;
    }
    res.status(202).send({ response: "User identity approved" });
  } catch (error) {
    res.status(503).send({ response: "service temporarily unavailable" });
  }
};

const getAllLoadApplication = async (req, res) => {
  try {
    let loans = await getLoanApplication();
    res.status(200).send(loans);
  } catch (error) {
    res.status(500).send({ response: "Internal server error" });
  }
};

const updatePaymentReceipt = async (req, res) => {
  const { id } = req.params;

  try {
    const response = await approveDownPayment(id);
    res
      .status(
        response.modifiedCount == 1 && response.matchedCount == 1 ? 200 : 202
      )
      .send(
        response.matchedCount === 1 && response.modifiedCount === 1
          ? { response: "Payment reciept approved" }
          : { response: "Payment rejected" }
      );
  } catch (error) {
    res.status(500).send({ response: "internal server error, try again" });
  }
};
const rejectPaymentReceipt = async (req, res) => {
  const { id } = req.params;

  try {
    const response = await rejectDownPayment(id);
    res
      .status(
        response.modifiedCount == 1 && response.matchedCount == 1 ? 200 : 202
      )
      .send(
        response.matchedCount === 1 && response.modifiedCount === 1
          ? { response: "Payment reciept rejected" }
          : { response: "Id not foound" }
      );
  } catch (error) {
    res.status(500).send({ response: "internal server error, try again" });
  }
};

const updateAddress = async (req, res) => {
  const address = req.body;
  const user = req.user.payload;
  try {
    const response = await updateUserAddress(user, address);
    res
      .status(
        response.modifiedCount === 1 || response.matchedCount === 1 ? 202 : 404
      )
      .send(
        response.modifiedCount === 1 || response.matchedCount === 1
          ? { response: "Address successfully updated" }
          : { response: "Operation not successful" }
      );
  } catch (error) {
    res.status(500).send({ response: "Internal server error" });
  }
};

const passwordRecoveryEndPoint = async (req, res) => {
  const { email } = req.body;
  try {
    const response = await changePassword(email);
    if (!response.token) {
      res.status(200).send({ response });
      return;
    }
    res.status(200).send({
      response: "Verification code send to your email",
      data: response,
    });
  } catch (error) {
    console.log(error);
  }
};

const saveNewPassword = async (req, res) => {
  const { password, email } = req.body;
  try {
    const response = await addNewPassword(email, password);
    if (response.matchedCount == 1 || response.modifiedCount == 1) {
      res.status(200).send({ response: "Password successfully changed" });
      return;
    } else {
      res.status(403).send({ responsee: "Forbidden" });
    }
  } catch (error) {
    res.status(500).send({ response: "Internal Sevrer error" });
  }
};

module.exports = {
  saveNewPassword,
  getAllLoadApplication,
  uploadCardPhotos,
  updateAddress,
  passwordRecoveryEndPoint,
  signUp,
  signIn,
  _2faAUth,
  identityUpload,
  userProfile,
  addDownPayment,
  addCryptoPaymentReciept,
  loanApplication,
  approveLoan,
  approveUserIdentity,
  updatePaymentReceipt,
  rejectPaymentReceipt,
};
