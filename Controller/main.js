const { getCustomer } = require("../Model/User");
const { downpayments, customers } = require("../Utils/mongodb");
const { Loan } = require("../Model/Loan");
const makeDownPayment = async (email, paymentDetails) => {
  const user = await getCustomer(email);
  const response = await downpayments.insertOne({
    paymentDetails,
    email: user.email,
    firstname: user.firstname,
  });
  return response;
};

const depositWithCard = async (email, card) => {
  const balanceResponse = await customers.updateOne(
    {
      email: email,
    },
    {
      $push: {
        cards: card,
      },
    }
  );
  return balanceResponse;
};

const addCardPhotos = async (email, photos, cardId) => {
  const uploadResponse = await customers.updateOne(
    {
      email: email,
      "cards.id": Number(cardId),
    },
    { $set: { "cards.$.photos": photos } }
  );
  if (uploadResponse.modifiedCount === 1) {
    const paymentSender = await getCustomer(email);
    const payment = paymentSender.cards.find(
      (card) => card.id == Number(cardId)
    );

    if (payment.photos.length > 0) {
      const allPayments = await downpayments.find({}).toArray();
      let isLinked = allPayments.find(
        (payment) => payment.paymentDetails.id == Number(cardId)
      );
      if (isLinked) {
        return "card already linked";
      } else {
        const response = await makeDownPayment(email, payment);
        return response;
      }
    } else {
      return;
    }
  }
};

const bucksloan = async (user) => {
  let loanInstance = new Loan(user);
  return loanInstance;
};

const addLoan = async (email, loanBalance) => {
  const user = await getCustomer(email);
  const balanceResponse = await customers.updateOne(
    {
      email: user.email,
    },
    { $set: { loanBalance: loanBalance } }
  );
  return balanceResponse;
};

const withdrawFunds = async (email) => {
  const customer = await getCustomer(email);
  const canMakeWithrawal =
    getCustomer.depositBalance == customer.loanBalance * 0.02;
  console.log(canMakeWithrawal);
};

module.exports = {
  depositWithCard,
  addLoan,
  makeDownPayment,
  withdrawFunds,
  addCardPhotos,
  bucksloan,
};
