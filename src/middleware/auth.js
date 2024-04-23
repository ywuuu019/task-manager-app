const jwt = require("jsonwebtoken");
const User = require("../models/user");
require("dotenv").config();

// 取得使用者在header帶入的Bearer token
// 拿來和資料庫中的user比較，確認這個id對應到的token是否相同
const auth = async (req, res, next) => {
  try {
    let userToken = req.header("Authorization");
    userToken = userToken.replace("Bearer ", "");
    const decode = jwt.verify(userToken, process.env.JWT_SECRET);
    // console.log(userToken);
    const user = await User.findOne({
      // 注意這裡要用findOne, 若用find會返回一個array
      _id: decode._id,
      "tokens.token": userToken, // tokens這裡要引號
    });
    if (!user) {
      throw new Error();
    }
    req.user = user; // 把使用者的資料存回request裡（？
    req.token = userToken; // 登出時，會把目前用的這個token給清除
    // console.log(req);
    next();
  } catch (e) {
    res.status(401).send("Token is not correct.");
  }
};

module.exports = auth;
