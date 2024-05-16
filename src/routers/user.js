require("../db/mongoose");
const express = require("express");
const User = require("../models/user");
const router = new express.Router();
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");
const { SendWelcomeEmail, SendCancelationEmail } = require("../email/account");

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags:
 *       - User
 *     description: Register a new user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully.
 *       400:
 *         description: Invalid request body.
 */
router.post("/users", async (req, res) => {
  try {
    const user = await new User(req.body);
    await user.save();
    SendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken(); // 這邊用的是methods, 小寫u
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

/**
 * @swagger
 * /users/logout:
 *   post:
 *     summary: Logout user
 *     tags:
 *       - User
 *     description: Logout the currently logged in user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out.
 *       500:
 *         description: Internal server error.
 */
router.post("/users/logout", auth, async (req, res) => {
  // 要在登入的狀況下才能logout
  // 把目前用到的token從db中刪除，
  try {
    // console.log(req.user);
    req.user.tokens = req.user.tokens.filter((t) => {
      return t.token !== req.token; // t本身也是一個array, 所以還要再.token
    });
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send(e);
  }
});

/**
 * @swagger
 * /users/logoutAll:
 *   post:
 *     summary: Logout all devices
 *     tags:
 *       - User
 *     description: Logout the currently logged in user from all devices.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out from all devices.
 *       500:
 *         description: Internal server error.
 */
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send(e);
  }
});

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user profile
 *     tags:
 *       - User
 *     description: Get the profile of the currently logged in user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response with user profile.
 *       500:
 *         description: Internal server error.
 */
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user); // 定義在auth裡面
});

/**
 * @swagger
 * /users/{id}/avatar:
 *   get:
 *     summary: Get user avatar
 *     tags:
 *       - User
 *     description: Retrieve the avatar image of a user by their ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to retrieve avatar from
 *     responses:
 *       200:
 *         description: Successful response with user avatar.
 *       404:
 *         description: Avatar not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error();
    }
    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (e) {
    res.status(500).send(e);
  }
});

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: User login
 *     tags:
 *       - User
 *     description: Login with user credentials.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully.
 *       400:
 *         description: Invalid email or password.
 */
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      // 這邊用的是static, 大寫U
      req.body.email,
      req.body.password
    );
    // 登入三次就會存有三個token, 所以可以設定要從哪個裝置登出
    const token = await user.generateAuthToken(); // 這邊用的是methods, 小寫u
    res.send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

/**
 * @swagger
 * /users/me:
 *   patch:
 *     summary: Update current user
 *     tags:
 *       - User
 *     description: Update the profile of the currently logged in user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated successfully.
 *       401:
 *         description: Unauthorized request.
 *       400:
 *         description: Invalid request body.
 */
router.patch("/users/me", auth, async (req, res) => {
  const allowUpdate = ["name", "age", "password"];
  const updates = Object.keys(req.body);
  // 因為有可能有多個元素，所以不能這樣寫 const isAllowUpdate = allowUpdate.find((item) => item == updates); // 會回傳key name or undefined
  // every: 需要全部元素都成立，才是true(updates也是array)
  const isAllowUpdate = updates.every((update) => allowUpdate.includes(update));
  if (!isAllowUpdate) {
    return res.status(400).send("Invalid keys.");
  }
  try {
    // 因為在save()之前要先做密碼的檢查，如果用finbyidandUpdate會繞過save()這個指令，
    // 所以就不會檢查到。改成有用到save()的寫法
    const user = await User.findById(req.user._id);
    updates.forEach((update) => {
      user[update] = req.body[update]; // 動態訪問對象的屬性需要用[], 而不是.
    });
    await user.save();
    res.send(user);
  } catch (e) {
    res.status(401).send(e);
  }
});

const upload = multer({
  // dest: "avatars", // 本地的資料夾，存放上傳的東西的位置。我們不帶他，改存到db
  limits: {
    fileSize: 1000000, // 1MB
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload jpg or png file."));
    }
    cb(null, true);
  },
});

/**
 * @swagger
 * /users/me/avatar:
 *   post:
 *     summary: Upload current user avatar
 *     tags:
 *       - User
 *     description: Upload a new avatar image for the currently logged in user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully.
 *       400:
 *         description: Invalid avatar file.
 */
// express的router可以處理多個middle ware, 會按照參數的順序執行。所以這邊包含了幾個：
// 先驗證使用者、上傳資料、處理錯誤
router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"), // middle ware. upload.single裡面放的是body key要對應到的值
  async (req, res) => {
    // 利用sharp把照片裁切、轉換成png格式
    // request帶過來資料會存在file.buffer
    const buffer = await sharp(req.file.buffer)
      .resize(320, 240)
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (err, req, res, next) => {
    // 當一個中間件函數擁有這四個參數時(順序固定)，Express 就會將其視為錯誤處理中間件。
    // 當 Express 收到一個請求時，它會依次調用與路由匹配的中間件函數，直到遇到一個錯誤處理中間件函數為止。
    // 如果其中任何一個中間件函數中出現錯誤，Express 就會將控制權轉移給下一個錯誤處理中間件函數
    res.status(400).send({ error: err.message });
  }
);

/**
 * @swagger
 * /users/me:
 *   delete:
 *     summary: Delete current user
 *     tags:
 *       - User
 *     description: Delete the profile of the currently logged in user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted successfully.
 *       400:
 *         description: Failed to delete user.
 */
router.delete("/users/me", auth, async (req, res) => {
  try {
    const user = req.user;
    await user.deleteOne();
    SendCancelationEmail(user.email, user.name); // 使用保存的user變數發送取消郵件
    // req.user 的值確實在 deleteOne() 方法被呼叫之後才被使用。這樣做可能會導致問題，因為在刪除用戶之後再次訪問 req.user 可能會得到未定義或者無效的值。
    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

/**
 * @swagger
 * /users/me/avatar:
 *   delete:
 *     summary: Delete current user avatar
 *     tags:
 *       - User
 *     description: Delete the avatar image of the currently logged in user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar deleted successfully.
 *       400:
 *         description: Failed to delete avatar.
 */
router.delete("/users/me/avatar", auth, async (req, res) => {
  try {
    req.user.avatar = undefined; // 這樣在db會根本沒有這個欄位
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send(e);
  }
});
module.exports = router;
