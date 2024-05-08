const { verification } = require("../Utils/mongodb");
const newVerification = async (user,email, identityType, photos) => {
  const response = await verification.insertOne({ user,email, identityType, photos });
  return response;
};
module.exports = { newVerification };
