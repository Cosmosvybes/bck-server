const jwt = require("jsonwebtoken");

const Auth = (req, res, next) => {
  const token = req.cookies.userToken;
  let userToken_ = req.params.userToken;
  if (!token && !userToken_)
    res.status(401).send({ response: "sign in to your account" });
  const userData = jwt.verify(token ? token : userToken_, process.env.api_key);
  req.user = userData;
  next();
};

const TwoFa = (req, res, next) => {
  const token_ = req.params.token;
  const token = req.cookies.Two_Fa;
  console.log(token_);
  if (!token && !token_) {
    res.status(401).send({ response: "token not found, try again" });
  }
  const tokenData = jwt.verify(token ? token : token_, process.env.api_secret);
  req.user = tokenData;
  next();
};

module.exports = { Auth, TwoFa };
