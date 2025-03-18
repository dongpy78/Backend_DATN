const express = require("express");
const userController = require("../controllers/user.controller");

const router = express.Router();

router.put("/setDataUserSetting", userController.setDataUserSetting);

module.exports = router;
