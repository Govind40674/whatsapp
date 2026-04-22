require("dotenv").config();
const express = require("express");


const connectDB = require("./db_config");

connectDB();


const app = express();

module.exports = app;