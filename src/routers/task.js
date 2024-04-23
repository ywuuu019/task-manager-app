require("../db/mongoose");
const express = require("express");
const Task = require("../models/task");
const router = new express.Router();
const auth = require("../middleware/auth");
const User = require("../models/user");

router.post("/tasks", auth, async (req, res) => {
  try {
    // 關聯task and user
    const task = new Task({
      ...req.body,
      owner: req.user._id,
    });
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

// 只能得到該使用者的task
// GET /tasks?completed=true
// GET /tasks?limit=10&skip=10 : 一頁有10個，我略過10個，所以來到第二頁
// GET /tasks?sortedBy=createdAt:asc/desc
router.get("/tasks", auth, async (req, res) => {
  try {
    const match = {};
    const sort = {};
    if (req.query.completed) {
      match.completed = req.query.completed === "true";
    }
    if (req.query.sortedBy) {
      const part = req.query.sortedBy.split(":");
      sort[part[0]] = part[1] === "asc" ? 1 : -1;
      // 因為要放變數，所以不能用點，只能用方括號。且我們不知道使用者的查詢條件是什麼，所以不能寫死
      // console.log(sort);
    }
    await req.user.populate({
      path: "mytask",
      match,
      options: {
        limit: parseInt(req.query.limit), // 將字串轉成int, 要注意使用者輸入的是string
        skip: parseInt(req.query.skip),
        sort,
      },
    });
    const result = req.user.mytask;
    res.send(result);
  } catch (e) {
    res.status(500).send(error);
  }
});

router.get("/task/:id", auth, async (req, res) => {
  try {
    const _id = req.params.id;
    const task = await Task.findOne({ _id: _id, owner: req.user._id });
    // 確認該id是不是這個owner所擁有的
    if (!task) {
      return res.status(404).send("Can't find task by this id.");
    }
    res.send(task);
  } catch (e) {
    res.status(500).send(error);
  }
});

router.patch("/task/:id", auth, async (req, res) => {
  const allowUpdate = ["description", "completed"];
  const update = Object.keys(req.body);
  const isValidInput = update.every((update) => allowUpdate.includes(update));
  if (!isValidInput) {
    return res.status(404).send({ error: "Invalid input." });
  }
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      return res.status(404).send("Id is not found.");
    }
    update.forEach((update) => {
      task[update] = req.body[update];
    });

    await task.save();
    res.send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/task/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete(
      // 不能用findbyIdAndDelete, 因為他只會查詢id, 不會查詢owner
      { _id: req.params.id, owner: req.user._id },
      {
        runValidators: true,
      }
    );
    if (!task) {
      return res.status(404).send("Can't find the task.");
    }
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
