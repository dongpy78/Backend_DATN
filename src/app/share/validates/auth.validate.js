const _ = require("lodash");
// const authConstants = require("../constants/auth.constants");

class AuthValidate {
  static isEmailValid(email) {
    // Kiểm tra nếu email là một chuỗi
    if (!_.isString(email)) {
      throw new Error("Invalid input: email is required");
    }

    // Biểu thức chính quy để kiểm tra định dạng email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Kiểm tra và trả về true nếu email hợp lệ
    return emailRegex.test(email);
  }

  static isPhoneNumberValid(phoneNumber) {
    // Kiểm tra nếu số điện thoại là một chuỗi
    if (!_.isString(phoneNumber)) {
      throw new Error("Invalid input: phone number is required");
    }

    // Biểu thức chính quy để kiểm tra định dạng số điện thoại
    const phoneNumberRegex =
      /^`latex:\(?([0-9]{3})\)`?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;

    // Kiểm tra và trả về true nếu số điện thoại hợp lệ
    return phoneNumberRegex.test(phoneNumber);
  }
}

module.exports = AuthValidate;

//10: email
//20: password
