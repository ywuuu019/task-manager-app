const request = require("supertest");
const app = require("../src/app");
const {
  userOneId,
  userOne,
  setupDB,
  userOneTaskId,
  userTwo,
} = require("./fixtures/db");
const mongoose = require("mongoose");
const Task = require("../src/models/task");

beforeEach(setupDB);

test("Should create a task by user", async () => {
  const response = await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: "Wash clothes",
      completed: "false",
    })
    .expect(201);

  const task = await Task.findById(response.body._id);
  expect(task).not.toBeNull();
  expect(task.completed).toEqual(false);
});

test("Should get all task belong to userOne", async () => {
  const response = await request(app)
    .get("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .expect(200);

  expect(response.body.length).toBe(2);
});

afterAll(() => {
  mongoose.connection.close(); // 沒有加上這個就會一直出現 Jest did not exit one second after the test run has completed.
});

test("userTwo should not delete userOne's task", async () => {
  await request(app)
    .delete(`/tasks/${userOneTaskId}`)
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .expect(404);
  const task = await Task.findById(userOneTaskId);
  expect(task).not.toBeNull();
});
