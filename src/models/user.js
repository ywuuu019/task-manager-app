const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./task");
require("dotenv").config();

const userSchema = new mongoose.Schema(
  {
    // 第一個參數是model名稱, 自行定義
    name: {
      type: String,
      required: true, // https://mongoosejs.com/docs/schematypes.html
      trim: true, // 修剪掉名字前後的空格
    },
    age: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error("Age must be a postive number.");
        }
      },
    },
    email: {
      type: String,
      lowercase: true,
      required: true,
      unique: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is not correct.");
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minLength: 6,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error("Password can't include 'password'");
        }
      },
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: Buffer,
    },
  },
  { timestamps: true }
);

userSchema.virtual("mytask", {
  // name可以自由定義
  ref: "Task", // model name
  localField: "_id", // 由我這個model裡面的_id
  foreignField: "owner", // 對應到Task model的owner欄位
});

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: "2d",
  });
  // console.log(token);
  user.tokens = user.tokens.concat({ token }); // 把object接起來，設定回原本的array
  await user.save();
  return token;
};

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Can't find user.");
  }
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error("Login failed.");
  }
  return user; 
};

userSchema.pre("save", async function (next) {
  // 這邊不能用arrow function
  const user = this;
  if (user.isModified("password")) {
    // 當password被建立、或是被修改，都會是true
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

// cascade delete: 在刪除user的同時，也刪除他對應的task
userSchema.pre(
  "deleteOne",
  { document: true, query: false }, // 官方文件說若用deleteOne要加上這兩個參數，https://mongoosejs.com/docs/middleware.html#pre
  async function (next) {
    await Task.deleteMany({ owner: this._id });
    next();
  }
);

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject(); // 要先轉成object

  // 只呈現我們要回傳的特定內容
  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;

  return userObject;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
