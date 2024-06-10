const { customers } = require("../Utils/mongodb");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const newCustomer = async (firstname, lastname, phone, email, password) => {
  const encryptedPassword = await bcrypt.hash(password, saltRounds);
  const response = await customers.insertOne({
    id: Date.now(),
    firstname: firstname,
    lastname: lastname,
    phone: phone,
    email: email,
    password: encryptedPassword,
    isVerified: false,
    transactions: [],
    cards: [],
    accountBalance: 0,
  });
  if (!response.insertedId) {
    return "Operaton failed";
  }
  return getCustomer(email);
};

const getCustomer = async (email) => {
  const user = await customers.findOne({ email: email });
  return user;
};
module.exports = { newCustomer, getCustomer };
