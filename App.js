const express = require("express");
const PORT = 8080;
const { urlencoded } = require("body-parser");
const app = express();
app.use(urlencoded({ extended: true }));
app.use(express.json());
var cors = require("cors");
app.use(cors({ origin: "http://localhost:5173", optionsSuccessStatus: 200 }));

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
} = require("./Routes/API");
const { TwoFa, Auth } = require("./Middleware/Authenticator");
const { uploader } = require("./Middleware/Uploader");
app.use(cookieParser());
app.get("/api/test/", async (req, res) => {
  res.send({ response: "hello testing works" });
});
app.post("/api/signup", signUp);
app.post("/api/signin", signIn);
app.post("/api/verify", TwoFa, _2faAUth);
app.post("/api/user/deposit", Auth, addDownPayment);
app.post(
  "/api/identity/upload",
  Auth,
  uploader.single("image"),
  identityUpload
);
app.get("/api/user", Auth, userProfile);
app.patch(
  "/api/upload/cards",
  Auth,
  uploader.array("photos", 12),
  uploadCardPhotos
);
app.post(
  "/api/crypto-payment",
  Auth,
  uploader.single("photo"),
  addCryptoPaymentReciept
);

app.post("/api/new-loan/apply", Auth, loanApplication);
app.post("/api/approve/loan/:id", approveLoan);

app.listen(PORT, () => {
  console.log(`Server running ${PORT}`);
});
