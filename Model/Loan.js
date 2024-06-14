const { mailerSender } = require("../Utils/Mailer");
const { loans } = require("../Utils/mongodb");
const { customers } = require("../Utils/mongodb");
const { getCustomer } = require("./User");

const checkPendingLoanRequest = async (user) => {
  let userData = await customers.findOne({ email: user });
  const loansRecord = userData.transactions;
  let loanWithPendingStatus = loansRecord.find(
    (loan) => loan.isApproved === false
  );
  return loanWithPendingStatus ? true : false;
};

const getLoan = async (user, loanData) => {
  let pendingStatus = await checkPendingLoanRequest(user);
  let userInfo = await getCustomer(user);
  let { firstname, lastname } = userInfo;

  let loanInfo = {
    email: user,
    userData: { firstname, lastname },
    id: Date.now(),
    isApproved: false,
    loanData,
  };

  if (!pendingStatus) {
    let insertionResponse = await customers.updateOne(
      { email: user },
      { $push: { transactions: loanInfo } }
    );
    await loans.insertOne(loanInfo);
    return insertionResponse;
  } else {
    return "you have a pending loan request";
  }
};

const approveLoanRequest = async (user, loanId) => {
  let response = await loans.updateOne(
    { id: Number(loanId) },
    { $set: { isApproved: true } }
  );
  await customers.updateOne(
    { email: user, "transactions.id": Number(loanId) },
    { $set: { "transactions.$.isApproved": true } }
  );
  let loanApplication = await loans.findOne({ id: Number(loanId) });
  let { amount, loantype, loanTerm } = loanApplication.loanData;
  const { firstname } = loanApplication.userData;
  if (response.matchedCount === 1) {
    await customers.updateOne(
      { email: user },
      { $set: { accountBalance: amount } }
    );
  }
  const mail = {
    from: '"Bucksloan US"  <no-reply@bucksloan@gmail.com>',
    to: user,
    subject: "Loan Approval",
    html: `<p>Dear ${firstname},</p>
            <p>Congratulations!</p>
            <p> We are thrilled to inform you that your loan application with Bucksloan has been successfully approved. After a thorough review of your application, we are pleased to extend to you a loan amount of ${amount}.
            If you have any questions or need further assistance, please do not hesitate to contact our customer service team  or via email.Thank you for choosing Bucksloan for your financial needs. We look forward to serving you.</p>
            <strong>Loan Details</strong>
            <span><b>Loan Type - </b> <p> ${loantype}</p>  </span>
            <span><b>Loan Term - </b> <p> ${loanTerm}</p>  </span>
            <span><b>Loan Amount - </b> <p>  ${amount}</p>  </span>
            <p>Best regards,</p>
            <p style="color:coral; text-align:center;">The bucksloan team. &copy;</p>`,
  };
  await mailerSender(mail);
  return response;
};

module.exports = { getLoan, approveLoanRequest };
