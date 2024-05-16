require("../db/mongoose");
const express = require("express");
const Task = require("../models/task");
const router = new express.Router();
const auth = require("../middleware/auth");
const User = require("../models/user");

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     tags:
 *       - Task
 *     description: Create a new task associated with the logged-in user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Task'
 *     responses:
 *       201:
 *         description: Task created successfully.
 *       400:
 *         description: Invalid request body.
 *       401:
 *         description: Unauthorized request.
 */
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
/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get tasks
 *     tags:
 *       - Task
 *     description: Retrieve tasks associated with the logged-in user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: completed
 *         schema:
 *           type: boolean
 *         description: Filter tasks by completion status.
 *       - in: query
 *         name: sortedBy
 *         schema:
 *           type: string
 *         description: Sort tasks by a field (e.g., createdAt:asc).
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit the number of tasks returned.
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *         description: Skip a certain number of tasks.
 *     responses:
 *       200:
 *         description: Successful response with tasks.
 *       500:
 *         description: Internal server error.
 */
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

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     tags:
 *       - Task
 *     description: Retrieve a task by its ID, associated with the logged-in user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the task to retrieve
 *     responses:
 *       200:
 *         description: Successful response with task data.
 *       404:
 *         description: Task not found.
 *       500:
 *         description: Internal server error.
 */
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

/**
 * @swagger
 * /tasks/{id}:
 *   patch:
 *     summary: Update task by ID
 *     tags:
 *       - Task
 *     description: Update a task by its ID, associated with the logged-in user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the task to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Task'
 *     responses:
 *       200:
 *         description: Task updated successfully.
 *       400:
 *         description: Invalid request body.
 *       404:
 *         description: Task ID not found.
 */
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

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete task by ID
 *     tags:
 *       - Task
 *     description: Delete a task by its ID, associated with the logged-in user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the task to delete
 *     responses:
 *       200:
 *         description: Task deleted successfully.
 *       404:
 *         description: Task ID not found.
 *       500:
 *         description
 */
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
