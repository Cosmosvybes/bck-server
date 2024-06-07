const { loans } = require("../Utils/mongodb");
const { customers } = require("../Utils/mongodb");
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
    let { user } = loanApplication;
    let response = await customers.updateOne(
      { email: user, "transactions.id": id },
      { $set: { "transactions.$.status": "Approved" } }
    );
    await loans.updateOne({ id: id }, { $set: { status: "Approved" } });
    return response;
  }
}

module.exports = { Loan };
