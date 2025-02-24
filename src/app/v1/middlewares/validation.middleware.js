const { validationResult, body } = require("express-validator");
const db = require("../models");
const {
  CustomError,
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../errors/customErrors");

class ValidationMiddleware {
  static withValidationErrors(validateValues) {
    return [
      validateValues,
      (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          const errorArray = errors.array();

          // Ánh xạ lỗi đầu tiên để quyết định loại lỗi
          const firstError = errorArray[0];
          const errorMessage = firstError.msg;

          // Xử lý các trường hợp lỗi cụ thể
          if (errorMessage === "Email not found in the system.") {
            throw new NotFoundError(errorMessage);
          }
          if (errorMessage.startsWith("not authorized")) {
            throw new UnauthorizedError("Not authorized to access this route");
          }

          // Nếu không thuộc trường hợp đặc biệt, ném BadRequestError với tất cả lỗi
          const allErrorMessages = errorArray.map((err) => err.msg).join(", ");
          throw new BadRequestError(allErrorMessages);
        }
        next(); // Tiếp tục nếu không có lỗi
      },
    ];
  }

  static validateRegisterInput() {
    return this.withValidationErrors([
      body("email")
        .notEmpty()
        .withMessage("email is required")
        .isEmail()
        .withMessage("invalid email format")
        .custom(async (email) => {
          const existingEmail = await db.Account.findOne({ where: { email } });
          if (existingEmail) {
            return Promise.reject("email already exists");
          }
        }),
      body("phonenumber")
        .notEmpty()
        .withMessage("phonenumber is required")
        .custom(async (phonenumber) => {
          const existingPhoneNumber = await db.User.findOne({
            where: { phonenumber },
          });
          if (existingPhoneNumber) {
            return Promise.reject("phonenumber already exists");
          }
        }),
      body("password").notEmpty().withMessage("password is required"),
      body("firstName").notEmpty().withMessage("first name is required"),
      body("lastName").notEmpty().withMessage("last name is required"),
    ]);
  }

  static validateLoginInput() {
    return this.withValidationErrors([
      body("email")
        .notEmpty()
        .withMessage("email is required")
        .isEmail()
        .withMessage("invalid email format")
        .custom(async (email) => {
          try {
            const existingEmail = await db.Account.findOne({
              where: { email },
            });
            if (!existingEmail) {
              throw new Error("Email not found in the system.");
            }
          } catch (error) {
            // Nếu lỗi không phải do không tìm thấy email, ném lỗi chung
            if (error.message !== "Email not found in the system.") {
              throw new Error("Error validating email");
            }
            throw error; // Ném lỗi "Email not found" để validation xử lý
          }
        }),
      body("password").notEmpty().withMessage("password is required"),
    ]);
  }

  static validateCreateNewAllCode() {
    return this.withValidationErrors([
      body("code")
        .notEmpty()
        .withMessage("code is required")
        .custom(async (code) => {
          const existingCode = await db.Allcode.findOne({
            where: { code },
          });
          if (existingCode) {
            return Promise.reject("code already exists");
          }
        }),
      body("type").notEmpty().withMessage("type is required"),
      body("value").notEmpty().withMessage("value is required"),
    ]);
  }

  static validateUpdateAllCode() {
    return this.withValidationErrors([
      body("code")
        .notEmpty()
        .withMessage("code is required")
        .custom(async (code) => {
          const existingCode = await db.Allcode.findOne({
            where: { code },
          });
          if (!existingCode) {
            return Promise.reject("code not found in the system.");
          }
        }),
      body("type").notEmpty().withMessage("type is required"),
      body("value").notEmpty().withMessage("value is required"),
    ]);
  }

  static validateCreateNewCompany() {
    return this.withValidationErrors([
      body("name")
        .notEmpty()
        .withMessage("name is required")
        .custom(async (name) => {
          const existingCompany = await db.Company.findOne({
            where: { name },
          });
          if (existingCompany) {
            return Promise.reject("Name company already exists");
          }
        }),
      body("phonenumber")
        .notEmpty()
        .withMessage("phonenumber is required")
        .custom(async (phonenumber) => {
          const existingPhoneNumber = await db.Company.findOne({
            where: { phonenumber },
          });
          if (existingPhoneNumber) {
            return Promise.reject("phonenumber already exists");
          }
        }),
      body("address").notEmpty().withMessage("address is required"),
      body("descriptionHTML")
        .notEmpty()
        .withMessage("descriptionHTML is required"),
      body("descriptionMarkdown")
        .notEmpty()
        .withMessage("descriptionMarkdown is required"),
      body("amountEmployer")
        .notEmpty()
        .withMessage("amountEmployer is required"),
      body("userId").notEmpty().withMessage("userId is required"),
    ]);
  }

  static validateUpdateCompany() {
    return this.withValidationErrors([
      body("id").notEmpty().withMessage("id is required"),
      body("name").notEmpty().withMessage("name is required"),
      body("phonenumber").notEmpty().withMessage("phonenumber is required"),
      body("address").notEmpty().withMessage("address is required"),
      body("descriptionHTML")
        .notEmpty()
        .withMessage("descriptionHTML is required"),
      body("descriptionMarkdown")
        .notEmpty()
        .withMessage("descriptionMarkdown is required"),
      body("amountEmployer")
        .notEmpty()
        .withMessage("amountEmployer is required"),
    ]);
  }

  static validateCreateNewSkill() {
    return this.withValidationErrors([
      body("name").notEmpty().withMessage("name is required"),
      body("categoryJobCode")
        .notEmpty()
        .withMessage("categoryJobCode is required"),
    ]);
  }

  static validateUpdateSkill() {
    return this.withValidationErrors([
      body("id")
        .notEmpty()
        .withMessage("id is required")
        .custom(async (id) => {
          const foundSkill = await db.Skill.findOne({
            where: { id },
          });
          if (!foundSkill) {
            return Promise.reject("Skill not found in the system");
          }
        }),
      body("name").notEmpty().withMessage("name is required"),
      body("categoryJobCode")
        .notEmpty()
        .withMessage("categoryJobCode is required"),
    ]);
  }

  static validateCreateNewCv() {
    return this.withValidationErrors([
      body("userId").notEmpty().withMessage("userId is required"),
      // body("file").notEmpty().withMessage("file is required"),
      body("postId").notEmpty().withMessage("postId is required"),
      body("description").notEmpty().withMessage("description is required"),
    ]);
  }

  static validateCreatePostInput() {
    return this.withValidationErrors([
      body("name").notEmpty().withMessage("Name is required"),
      body("categoryJobCode")
        .notEmpty()
        .withMessage("Category job code is required"),
      body("addressCode").notEmpty().withMessage("Address code is required"),
      body("salaryJobCode")
        .notEmpty()
        .withMessage("Salary job code is required"),
      body("amount")
        .notEmpty()
        .withMessage("Amount is required")
        .isInt({ min: 1 })
        .withMessage("Amount must be a positive integer"),
      body("timeEnd").notEmpty().withMessage("Time end is required"),
      body("categoryJoblevelCode")
        .notEmpty()
        .withMessage("Category job level code is required"),
      body("userId").notEmpty().withMessage("User ID is required"),
      body("categoryWorktypeCode")
        .notEmpty()
        .withMessage("Category work type code is required"),
      body("experienceJobCode")
        .notEmpty()
        .withMessage("Experience job code is required"),
      body("genderPostCode")
        .notEmpty()
        .withMessage("Gender post code is required"),
      body("descriptionHTML")
        .notEmpty()
        .withMessage("Description HTML is required"),
      body("descriptionMarkdown")
        .notEmpty()
        .withMessage("Description Markdown is required"),
      body("isHot")
        .notEmpty()
        .withMessage("isHot is required")
        .isIn(["0", "1"])
        .withMessage("isHot must be 0 or 1"),
    ]);
  }

  static validateReupPostInput() {
    return this.withValidationErrors([
      body("userId").notEmpty().withMessage("User ID is required"),
      body("postId").notEmpty().withMessage("Post ID is required"),
      body("timeEnd").notEmpty().withMessage("Time end is required"),
    ]);
  }

  static validateHandleUpdatePostInput() {
    return this.withValidationErrors([
      body("id").notEmpty().withMessage("Post ID is required"),
      body("userId").notEmpty().withMessage("User ID is required"),
      body("name").notEmpty().withMessage("Name is required"),
      body("categoryJobCode")
        .notEmpty()
        .withMessage("Category job code is required"),
      body("addressCode").notEmpty().withMessage("Address code is required"),
      body("salaryJobCode")
        .notEmpty()
        .withMessage("Salary job code is required"),
      body("amount")
        .notEmpty()
        .isInt()
        .withMessage("Amount is required and must be an integer"),
      body("timeEnd").notEmpty().withMessage("Time end is required"),
      body("categoryJoblevelCode")
        .notEmpty()
        .withMessage("Category job level code is required"),
      body("categoryWorktypeCode")
        .notEmpty()
        .withMessage("Category work type code is required"),
      body("experienceJobCode")
        .notEmpty()
        .withMessage("Experience job code is required"),
      body("genderPostCode")
        .notEmpty()
        .withMessage("Gender post code is required"),
      body("descriptionHTML")
        .notEmpty()
        .withMessage("Description HTML is required"),
      body("descriptionMarkdown")
        .notEmpty()
        .withMessage("Description Markdown is required"),
    ]);
  }
}

module.exports = ValidationMiddleware;
