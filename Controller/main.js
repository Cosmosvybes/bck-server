const { getCustomer } = require("../Model/User");
const {
  downpayments,
  customers,
  loans,
  verification,
} = require("../Utils/mongodb");
// const { Loan } = require("../Model/Loan");
const { mailerSender } = require("../Utils/Mailer");

const makeDownPayment = async (email, paymentDetails) => {
  const user = await getCustomer(email);
  const { id } = paymentDetails;
  const response = await downpayments.insertOne({
    paymentDetails,
    email: user.email,
    firstname: user.firstname,
    isApproved: false,
    id,
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
    let paymentMethod = payment.paymentMethod;

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

const approveUser = async (userEmail) => {
  let user = await getCustomer(userEmail);
  let firstname = user.firstname;
  if (user.isVerified) {
    await customers.updateOne(
      { email: userEmail },
      { $set: { isVerified: false } }
    );
    await verification.updateOne(
      { email: userEmail },
      { $set: { isVerified: false } }
    );
    return { isDisapproved: true };
  }
  let userUpdateResponse = await customers.updateOne(
    { email: userEmail },
    { $set: { isVerified: true } }
  );
  await verification.updateOne(
    { email: userEmail },
    { $set: { isVerified: true } }
  );
  const mail = {
    from: '"Bucksloan US"  <no-reply@bucksloan@gmail.com>🎊',
    to: userEmail,
    subject: "Identity Approval Status ",
    html: `<p>Dear ${firstname},</p>
    <p>Sequel to your identity verification, this is to confirm that your user identification documents has been approved.</p>
    <p>You now have full access to our loan services, proceed to your dashboard to apply for any loan of your choice.</p>
    <p>Thanks again for your cooperation.
    </p>
    <p>Best regards,</p>
    <p>The bucksloan team</p>`,
  };
  await mailerSender(mail);

  return userUpdateResponse;
};

const getLoanApplication = async () => {
  const allLoanApplication = await loans.find({}).toArray();
  const payments = await downpayments.find({}).toArray();
  let usersId = await verification.find({}).toArray();
  return { payments, allLoanApplication, usersId };
};

const updateUserAddress = async (user, address) => {
  const updateResponse = await customers.updateOne(
    {
      email: user,
    },
    { $set: address }
  );
  return updateResponse;
};

const approveDownPayment = async (id) => {
  const response = await downpayments.updateOne(
    { id: Number(id) },
    { $set: { isApproved: true } }
  );
  console.log(response);
  return response;
};
const rejectDownPayment = async (id) => {
  const response = await downpayments.updateOne(
    { id: Number(id) },
    { $set: { isApproved: false } }
  );
  return response;
};

const withdrawFunds = async (email) => {
  const customer = await getCustomer(email);
  const canMakeWithrawal =
    getCustomer.depositBalance == customer.loanBalance * 0.02;
  console.log(canMakeWithrawal);
};

module.exports = {
  depositWithCard,
  updateUserAddress,
  addLoan,
  rejectDownPayment,
  makeDownPayment,
  withdrawFunds,
  addCardPhotos,
  approveUser,
  getLoanApplication,
  approveDownPayment,
};
