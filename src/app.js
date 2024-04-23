const express = require("express");
const mongoose = require("mongoose");
require("./db/mongoose");
const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");
require("dotenv").config();

const app = express();

app.use(express.json()); // 若沒加這行，就無法解析使用者回傳的json body
app.use(userRouter);
app.use(taskRouter);


module.exports = app;
