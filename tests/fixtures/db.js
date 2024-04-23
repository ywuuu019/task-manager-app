const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../../src/models/user");
const Task = require("../../src/models/task");

const userOneId = new mongoose.Types.ObjectId();
const userOne = {
  _id: userOneId,
  name: "testuser1",
  email: "testemail@gmail.com",
  password: "pass1234",
  age: "30",
  tokens: [{ token: jwt.sign({ _id: userOneId }, process.env.JWT_SECRET) }],
};

const userTwoId = new mongoose.Types.ObjectId();
const userTwo = {
  _id: userTwoId,
  name: "testuser2",
  email: "test2email@gmail.com",
  password: "book0000",
  age: "21",
  tokens: [{ token: jwt.sign({ _id: userTwoId }, process.env.JWT_SECRET) }],
};

const taskOne = {
  _id: new mongoose.Types.ObjectId(),
  description: "Go to gym",
  completed: "false",
  owner: userOne._id,
};

const taskTwo = {
  _id: new mongoose.Types.ObjectId(),
  description: "Go to supermarket",
  completed: "true",
  owner: userOne._id,
};

const taskThree = {
  _id: new mongoose.Types.ObjectId(),
  description: "Feed cat.",
  completed: "false",
  owner: userTwo._id,
};

const setupDB = async () => {
  await User.deleteMany();
  await Task.deleteMany();
  await new User(userOne).save();
  await new User(userTwo).save();
  await new Task(taskOne).save();
  await new Task(taskTwo).save();
  await new Task(taskThree).save();
};

module.exports = {
  userOneId,
  userOne,
  setupDB,
  userOneTaskId: taskOne._id,
  userTwo,
};
