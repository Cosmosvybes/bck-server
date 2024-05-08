const express = require("express");
const PORT = 8080;
const { urlencoded } = require("body-parser");
const app = express();
app.use(urlencoded({ extended: false }));
app.use(express.json());
const cookieParser = require("cookie-parser");
const {
  signUp,
  signIn,
  _2faAUth,
  identityUpload,
  userProfile,
} = require("./Routes/API");
const { TwoFa, Auth } = require("./Middleware/Authenticator");
const { uploader } = require("./Middleware/Uploader");
app.use(cookieParser());
app.post("/api/signup", signUp);
app.post("/api/signin", signIn);
app.post("/api/verify", TwoFa, _2faAUth);

app.post(
  "/api/identity/upload",
  Auth,
  uploader.single("image"),
  identityUpload
);
app.get("/api/user", Auth, userProfile);

app.listen(PORT, () => {
  console.log(`Server running ${PORT}`);
});
