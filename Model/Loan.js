const { mailerSender } = require("../Utils/Mailer");
const { loans } = require("../Utils/mongodb");
const { customers } = require("../Utils/mongodb");
const { getCustomer } = require("./User");
class Loan {
  constructor(user) {
    this.user = user;
  }
  async getLoan(loanData) {
    let response;
    if (typeof (await this.#hasPendingLoanRequest()) === "string") {
      return (async () => {
        response = await loans.insertOne({
          user: this.user,
          id: Date.now(),
          loanData,
          status: "Pending",
        });
        if (response.insertedId) {
          let loanRecord = await this.#loanRecord();
          delete loanRecord.user;
          await customers.updateOne(
            { email: this.user },
            { $set: { transactions: loanRecord } }
          );
        }
        return response.insertedId;
      })();
    } else {
      return (await this.#hasPendingLoanRequest())
        ? "You have a pending loan request!"
        : (async () => {
            response = await loans.insertOne({
              user: this.user,
              id: Date.now(),
              loanData,
              status: "Pending",
            });
            if (response.insertedId) {
              let loanRecord = await this.#loanRecord();
              delete loanRecord.user;
              await customers.updateOne(
                { email: this.user },
                { $set: { transactions: loanRecord } }
              );
            }
            return response;
          })();
    }
  }
  async #loanRecord() {
    let response = await loans.find({ user: this.user }).toArray();
    return response.length > 0 ? response : "no loan request yet";
  }

  async #hasPendingLoanRequest() {
    let loanRequestRes = await this.#loanRecord();
    if (typeof loanRequestRes === "object") {
      let hasPendingLoanRequest = loanRequestRes.filter(
        (loan) => loan.status === "Pending"
      );
      return hasPendingLoanRequest.length > 0 ? true : false;
    }
  }
  async updateLoanStatus(id) {
    let loanApplication = await loans.findOne({ id: id });
    let { amount, loantype, loanTerm } = loanApplication.loanData;
    let { user } = loanApplication;
    let customer = await getCustomer(user);
    let { firstname } = customer;

    let response = await customers.updateOne(
      { email: user, "transactions.id": id },
      { $set: { "transactions.$.status": "Approved" } }
    );
    if (response.matchedCount === 1) {
      await customers.updateOne(
        { email: user },
        { $set: { accountBalance: amount } }
      );
      const mail = {
        from: '"Bucksloan US"  <no-reply@bucksloan@gmail.com>',
        to: user,
        subject: "Loan Approval",
        html: `<p>Dear ${firstname},</p>
        <p>Congratulations!</p>
        <p> We are thrilled to inform you that your loan application with Bucksloan has been successfully approved. After a thorough review of your application, we are pleased to extend to you a loan amount of ${amount}.
        If you have any questions or need further assistance, please do not hesitate to contact our customer service team  or via email.Thank you for choosing Bucksloan for your financial needs. We look forward to serving you.</p>
        <strong  style="color:lightgray">Loan Details</strong>
        <p style="color:lightgray">Loan Type: ${loantype}</p>
        <p style="color:lightgray">Loan Term: ${loanTerm}</p>
        <p style="color:lightgray">Loan Amount: ${amount}</p>
        <p>Best regards,</p>
        <p>The bucksloan team.</p>`,
      };
      await mailerSender(mail);
    }
    await loans.updateOne({ id: id }, { $set: { status: "Approved" } });
    return response;
  }
}

module.exports = { Loan };
