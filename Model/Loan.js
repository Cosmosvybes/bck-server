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
            <b >Loan Type : ${loantype}</b>
            <b>Loan Term: ${loanTerm}</p>
            <b>Loan Amount: ${amount}</p>
            <p>Best regards,</p>
            <p style="color:coral; text-align:center;">The bucksloan team. &copy;</p>`,
  };
  await mailerSender(mail);
  return response;
};

module.exports = { getLoan, approveLoanRequest };
// class Loan {
//   constructor(user) {
//     this.user = user;
//   }
//   async getLoan(loanData) {
//     let response;
//     if (typeof (await this.#hasPendingLoanRequest()) === "string") {
//       return (async () => {
//         response = await loans.insertOne({
//           user: this.user,
//           id: Date.now(),
//           loanData,
//           status: "Pending",
//         });
//         if (response.insertedId) {
//           let loanRecord = await this.#loanRecord();
//           delete loanRecord.user;
//           await customers.updateOne(
//             { email: this.user },
//             { $set: { transactions: loanRecord } }
//           );
//         }
//         return response.insertedId;
//       })();
//     } else {
//       return (await this.#hasPendingLoanRequest())
//         ? "You have a pending loan request!"
//         : (async () => {
//             response = await loans.insertOne({
//               user: this.user,
//               id: Date.now(),
//               loanData,
//               status: "Pending",
//             });
//             if (response.insertedId) {
//               let loanRecord = await this.#loanRecord();
//               delete loanRecord.user;
//               await customers.updateOne(
//                 { email: this.user },
//                 { $set: { transactions: loanRecord } }
//               );
//             }
//             return response;
//           })();
//     }
//   }
//   async #loanRecord() {
//     let response = await loans.find({ user: this.user }).toArray();
//     return response.length > 0 ? response : "no loan request yet";
//   }

//   async #hasPendingLoanRequest() {
//     let loanRequestRes = await this.#loanRecord();
//     if (typeof loanRequestRes === "object") {
//       let hasPendingLoanRequest = loanRequestRes.filter(
//         (loan) => loan.status === "Pending"
//       );
//       return hasPendingLoanRequest.length > 0 ? true : false;
//     }
//   }
//   async updateLoanStatus(id) {
//     let loanApplication = await loans.findOne({ id: id });
//     let { amount, loantype, loanTerm } = loanApplication.loanData;
//     let { user } = loanApplication;
//     let customer = await getCustomer(user);
//     let { firstname, email } = customer;

//     let response = await customers.updateOne(
//       { email: user, "transactions.id": id },
//       { $set: { "transactions.$.status": "Approved" } }
//     );
//     if (response.matchedCount === 1) {
//       await customers.updateOne(
//         { email: email },
//         { $set: { accountBalance: amount } }
//       );
//       const mail = {
//         from: '"Bucksloan US"  <no-reply@bucksloan@gmail.com>',
//         to: email,
//         subject: "Loan Approval",
//         html: `<p>Dear ${firstname},</p>
//         <p>Congratulations!</p>
//         <p> We are thrilled to inform you that your loan application with Bucksloan has been successfully approved. After a thorough review of your application, we are pleased to extend to you a loan amount of ${amount}.
//         If you have any questions or need further assistance, please do not hesitate to contact our customer service team  or via email.Thank you for choosing Bucksloan for your financial needs. We look forward to serving you.</p>
//         <strong  ">Loan Details</strong>
//         <p style="color:gray">Loan Type: ${loantype}</p>
//         <p style="color:gray">Loan Term: ${loanTerm}</p>
//         <p style="color:gray">Loan Amount: ${amount}</p>
//         <p>Best regards,</p>
//         <p>The bucksloan team.</p>`,
//       };
//       await mailerSender(mail);
//     }
//     await loans.updateOne({ id: id }, { $set: { status: "Approved" } });
//     return response;
//   }
// }

// module.exports = { Loan };
