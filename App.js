const express = require("express");
const PORT = process.env.PORT || 8080;
const { urlencoded } = require("body-parser");
const app = express();
app.use(urlencoded({ extended: true }));
app.use(express.json());
const cors = require("cors");
app.use(
  cors({
    origin: "http://localhost:5173",
    optionsSuccessStatus: 200,
    credentials: true,
  })
);
// https://bucksloan.org
//http://localhost:5173
const cookieParser = require("cookie-parser");
const {
  signUp,
  signIn,
  _2faAUth,
  identityUpload,
  userProfile,
  addDownPayment,
  uploadCardPhotos,
  addCryptoPaymentReciept,
  loanApplication,
  approveLoan,
  approveUserIdentity,
  getAllLoadApplication,
  updateAddress,
  updatePaymentReceipt,
  rejectPaymentReceipt,
  passwordRecoveryEndPoint,
  saveNewPassword,
} = require("./Routes/API");
const { TwoFa, Auth } = require("./Middleware/Auth/Authenticator");
const { uploader } = require("./Middleware/Uploader");

app.use(cookieParser());

app.post("/api/signup", signUp);
app.post("/api/signin", signIn);
app.post("/api/verify/:token", TwoFa, _2faAUth);
app.post("/api/user/deposit/:userToken", Auth, addDownPayment);
app.post(
  "/api/identity/upload/:userToken",
  Auth,
  uploader.single("image"),
  identityUpload
);
app.get("/api/user/:userToken", Auth, userProfile);
app.patch(
  "/api/upload/cards/:userToken",
  Auth,
  uploader.array("photos", 12),
  uploadCardPhotos
);
app.post(
  "/api/crypto-payment/:userToken",
  Auth,
  uploader.single("photo"),
  addCryptoPaymentReciept
);

app.post("/api/new-loan/apply/:userToken", Auth, loanApplication);
app.post("/api/approve/loan/:id", approveLoan);

app.patch("/api/approve/user/:user", approveUserIdentity);

app.get("/api/loans/application", getAllLoadApplication);

app.patch("/api/update/address/:userToken", Auth, updateAddress);

app.patch("/api/verify-downpayment/:id", updatePaymentReceipt);
app.patch("/api/reject-downpayment/:id", rejectPaymentReceipt);
app.patch("/api/password-recovery", passwordRecoveryEndPoint);
app.patch("/api/new/password", saveNewPassword);

app.post("/api/account/signout", async (req, res) => {
  try {
    res.status(200).send({ response: "account signed out" });
    res.cookie("userToken", "", {
      httpOnly: true,
      path: "/api/",
      maxAge: 0,
      secure: true,
    });
  } catch (error) {
    console.log(error);
  }
});

app.listen(PORT, () => {
  console.log(`Server running ${PORT}`);
});
