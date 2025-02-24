const express = require("express");
const companyController = require("../controllers/company.controller");
const ValidationMiddleware = require("../middlewares/validation.middleware");

const router = express.Router();

// Create new company
router.post(
  "/create-new-company",
  ValidationMiddleware.validateCreateNewCompany(),
  companyController.createCompany
);
router.put(
  "/update-company",
  ValidationMiddleware.validateUpdateCompany(),
  companyController.updateCompany
);
router.post("/ban-company", companyController.banCompany);
router.post("/unban-company", companyController.unbanCompany);
router.post("/accept-company", companyController.acceptCompany);
router.get("/list-companies", companyController.getListCompany);
router.get("/companies/by-id", companyController.getDetailCompanyById);
router.get("/companies/by-user", companyController.getDetailCompanyByUserId);
router.get("/users/by-company", companyController.getAllUserByCompanyId);
router.post("/quit-company", companyController.handleQuitCompany);
router.get("/admin/companies", companyController.getAllCompanyByAdmin);

module.exports = router;
