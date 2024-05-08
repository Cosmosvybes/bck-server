const { MongoClient } = require("mongodb");
const { config } = require("dotenv");
config();
const dbClient = new MongoClient(process.env.MONGO_URL);
const customers = dbClient.db("bucksloan").collection("customers");
const loans = dbClient.db("bucksloan").collection("applications");
const downpayments = dbClient.db("bucksloan").collection("payments");
const verification = dbClient.db("bucksloan").collection("user_Ids");
module.exports = { customers, loans, downpayments, verification };
