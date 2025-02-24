const express = require("express");
const skillController = require("../controllers/skill.controller");
const ValidationMiddleware = require("../middlewares/validation.middleware");

const router = express.Router();

// Create new skill

router.post(
  "/create-new-skill",
  ValidationMiddleware.validateCreateNewSkill(),
  skillController.createNewSkill
);
router.delete("/delete-skill", skillController.deleteSkill);
router.patch(
  "/update-skill",
  ValidationMiddleware.validateUpdateSkill(),
  skillController.updateSkill
);
router.get("/get-detail-skill-by-id", skillController.getDetailSkillById);
router.get("/skills-by-jobcode", skillController.getAllSkillByJobCode);
router.get("/list-skills", skillController.getListSkill);

module.exports = router;
