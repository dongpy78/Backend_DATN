const express = require("express");
const authController = require("../controllers/auth.controller");
const ValidationMiddleware = require("../middlewares/validation.middleware");
const middlewareControllers = require("../middlewares/verifyToken.middleware");

const { upload } = require("../middlewares/multer.middleware");

const router = express.Router();

// Signup route
router.post(
  "/register",
  ValidationMiddleware.validateRegisterInput(),
  authController.register
);

// Xác thực email
router.get("/verify-email", authController.verifyEmail);

router.post(
  "/login",
  ValidationMiddleware.validateLoginInput(),
  authController.login
);

router.patch("/update-user", authController.updateUser);

router.post("/refresh-token", authController.refreshToken);

router.post("/forgot-password", authController.forgotPassword);
router.post("/logout", authController.logout);
router.post("/ban-account", authController.banAccount);
router.post("/unban-account", authController.unbanAccount);
router.get("/get-all-user", authController.getAllUser);
router.get("/detail-user", authController.getDetailUserById);

module.exports = router;
