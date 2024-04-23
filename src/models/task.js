const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    // mongoose會幫我們根據這個名稱轉成小寫 +s , 建立一個collection(tasks)
    description: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", // 需要對應到user model名稱
    },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
