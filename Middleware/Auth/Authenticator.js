const jwt = require("jsonwebtoken");
const Auth = (req, res, next) => {
  const token = req.cookies.userToken;
  if (!token) res.status(401).send({ response: "sign in to your account" });
  const userData = jwt.verify(token, process.env.api_key);
  req.user = userData;
  next();
};

const TwoFa = (req, res, next) => {
  const token = req.cookies.Two_Fa;
  if (!token) {
    res.status(401).send({ response: "token not found, try again" });
  }
  const tokenData = jwt.verify(token, process.env.api_secret);
  req.user = tokenData;
  next();
};

module.exports = { Auth, TwoFa };
