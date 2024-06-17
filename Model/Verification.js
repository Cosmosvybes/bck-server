const { verification } = require("../Utils/mongodb");
const newVerification = async (user, email, identityType, photos, ssn) => {
  const response = await verification.insertOne({
    user,
    email,
    identityType,
    photos,
    ssn,
  });
  return response;
};
module.exports = { newVerification };
