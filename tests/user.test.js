const request = require("supertest");
const app = require("../src/app");
const mongoose = require("mongoose");
require("dotenv").config();
const User = require("../src/models/user");
const { userOneId, userOne, setupDB } = require("./fixtures/db");

beforeEach(setupDB);

jest.mock("@aws-sdk/client-sesv2", () => ({
  SESv2Client: jest.fn(() => ({
    send: jest.fn(),
  })),
  SendEmailCommand: jest.fn(),
}));

test("Should signup a new user", async () => {
  const response = await request(app)
    .post("/users")
    .send({
      name: "zzzzz",
      email: "aaaaa@gmail.com",
      password: "pass1234",
      age: "30",
    })
    .expect(201);

  // Assert that data is in the database
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();

  // Assert about the response
  expect(response.body).toMatchObject({
    // 有列出的項目一定要符合，其他沒列出的可忽略，ex: age
    user: { name: "zzzzz", email: "aaaaa@gmail.com" },
    token: user.tokens[0].token,
  });

  // Assert response body didn't have password
  expect(response.body.user.password).toBeUndefined(); // 在物件中，未賦值的屬性會返回undefined

  // Assert database encrypt the password
  expect(user.password).not.toBe("pass1234");
});

test("Should login existing user", async () => {
  const response = await request(app)
    .post("/users/login")
    .send({
      email: userOne.email,
      password: userOne.password,
    })
    .expect(200);

  // Assert new token is save in database
  const user = await User.findById(response.body.user._id);
  expect(response.body.token).toBe(user.tokens[1].token);
});

test("Should not login nonexistent user", async () => {
  await request(app)
    .post("/users/login")
    .send({
      email: "nonexistinguser@gmail.com",
      password: "pass1234",
    })
    .expect(400);
});

test("Should get profile for user", async () => {
  await request(app)
    .get("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
});

test("Should not get profile for unauthenticated user", async () => {
  await request(app)
    .get("/users/me")
    .set("Authorization", "Bearer notcorrecttoken")
    .send()
    .expect(401);
});

test("Should delete account for authenticated user", async () => {
  await request(app)
    .delete("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  const user = await User.findById(userOneId);
  expect(user).toBeNull();
});

test("Should not delete account for unauthenticated user", async () => {
  await request(app)
    .delete("/users/me")
    .set("Authorization", `Bearer notcorrecttoken`)
    .send()
    .expect(401);
});

test("Should upload avatar", async () => {
  await request(app)
    .post("/users/me/avatar")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .attach("avatar", "tests/fixtures/cat.jpeg")
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user.avatar).toEqual(expect.any(Buffer)); // 只要有Buffer即可，不比較內容
});

test("Should update valid user field", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: "Candy",
    })
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user.name).toBe("Candy");
});

test("Should not update invalid user field", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      location: "Taiwan",
    })
    .expect(400);
});

afterAll(() => {
  mongoose.connection.close(); 
  // 沒有加上這個就會出現 Jest did not exit one second after the test run has completed.
});
