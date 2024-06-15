const jwt = require("jsonwebtoken");

const Auth = (req, res, next) => {
  let userToken_ = req.params.userToken;
  if (!userToken_)
    res.status(401).send({ response: "sign in to your account" });
  const userData = jwt.verify(userToken_, process.env.api_key);
  req.user = userData;
  next();
};

const TwoFa = (req, res, next) => {
  const token_ = req.params.token;
  if (!token_) {
    res.status(401).send({ response: "token not found, try again" });
  }
  const tokenData = jwt.verify(token_, process.env.api_secret);
  req.user = tokenData;
  next();
};

module.exports = { Auth, TwoFa };
