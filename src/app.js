const express = require("express");
const mongoose = require("mongoose");
const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
require("./db/mongoose");
require("dotenv").config();

const app = express();

app.use(express.json()); // 若沒加這行，就無法解析使用者回傳的json body
app.use(userRouter);
app.use(taskRouter);

// Swagger 文件配置選項
const options = {
  definition: {
    openapi: "3.0.0", // OpenAPI 版本
    info: {
      title: "Task Manager API", // API 的標題
      version: "1.0.0", // 版本號
      description: "APIs for managing tasks", // API 的描述
    },
    components: {
      schemas: {
        User: {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
          required: ["name", "age", "email", "password"],
        },
        Task: {
          type: "object",
          properties: {
            description: { type: "string" },
            completed: { type: "boolean" },
          },
          required: ["description"],
        },
      },
    },
  },
  // 要掃描的路由文件路徑
  apis: ["./src/routers/*.js"],
};

// 產生 Swagger 文檔
const swaggerSpec = swaggerJsdoc(options);

// 使用 Swagger UI 中間件，提供 API 文檔的可視化界面
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = app;
