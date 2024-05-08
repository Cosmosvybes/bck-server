const { getCustomer } = require("../Model/User");
const { downpayments, customers } = require("../Utils/mongodb");

const makeDownPayment = async (user, paymentDetails) => {
  const newPayment = await downpayments.insertOne({ paymentDetails, user });
  return newPayment.insertedId;
};

const addDepositBalance = async (email, depositBalance, loanBalance) => {
  const user = await getCustomer(email);
  const balanceResponse = await customers.updateOne(
    {
      email: user.email,
    },
    { $set: { depositBalance: depositBalance, loanBalance: loanBalance } }
  );
};
