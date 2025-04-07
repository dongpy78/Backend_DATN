const e = require("express");
const schedule = require("node-schedule");
const db = require("../../v1/models");
const { Op } = require("sequelize");
const nodemailer = require("nodemailer");
const getStringMailTemplate = require("./mailTemplate");
let rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0, 1, 2, 3, 4, 5, 6];
rule.hour = 8;
rule.minute = 0;
rule.second = 0;
rule.tz = "Asia/Vientiane";

let sendmail = async (mailTemplate, userMail) => {
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  var mailOptions = {
    from: process.env.EMAIL_USER,
    to: userMail,
    subject: "Gợi ý việc làm cho bạn",
    html: mailTemplate,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    }
  });
};

let getTemplateMail = async (infoUser) => {
  try {
    const timeStampOfMonthAgo = 2592000000;
    let listpost = await db.Post.findAll({
      limit: 5,
      // offset: 0,
      where: {
        timePost: {
          [Op.gte]: new Date().getTime() - timeStampOfMonthAgo,
        },
        statusCode: "PS1",
        [Op.and]: [
          db.Sequelize.where(
            db.sequelize.col("postDetailData.jobTypePostData.code"),
            {
              [Op.like]: `%${infoUser.categoryJobCode}%`,
            }
          ),
          // db.Sequelize.where(db.sequelize.col('postDetailData.provincePostData.code'), {
          //     [Op.like]: `%${infoUser.addressCode}%`
          // }),
          // db.Sequelize.where(db.sequelize.col('postDetailData.salaryTypePostData.code'), {
          //     [Op.like]: `%${infoUser.salaryJobCode}%`
          // }),
          // db.Sequelize.where(db.sequelize.col('postDetailData.expTypePostData.code'), {
          //     [Op.like]: `%${infoUser.experienceJobCode}%`
          // }),
          db.Sequelize.where(
            db.sequelize.col("postDetailData.descriptionHTML"),
            {
              [Op.or]: infoUser.listSkills,
            }
          ),
        ],
      },
      include: [
        {
          model: db.DetailPost,
          as: "postDetailData",
          attributes: {
            exclude: ["statusCode"],
          },
          include: [
            {
              model: db.Allcode,
              as: "jobTypePostData",
              attributes: ["value", "code"],
            },
            {
              model: db.Allcode,
              as: "workTypePostData",
              attributes: ["value", "code"],
            },
            {
              model: db.Allcode,
              as: "salaryTypePostData",
              attributes: ["value", "code"],
            },
            {
              model: db.Allcode,
              as: "jobLevelPostData",
              attributes: ["value", "code"],
            },
            {
              model: db.Allcode,
              as: "genderPostData",
              attributes: ["value", "code"],
            },
            {
              model: db.Allcode,
              as: "provincePostData",
              attributes: ["value", "code"],
            },
            {
              model: db.Allcode,
              as: "expTypePostData",
              attributes: ["value", "code"],
            },
          ],
        },
      ],
      order: db.sequelize.literal("rand()"),
      raw: true,
      nest: true,
    });
    if (listpost && listpost.length > 0) {
      for (let post of listpost) {
        let user = await db.User.findOne({
          where: { id: post.userId },
          attributes: {
            exclude: ["userId"],
          },
        });
        let company = await db.Company.findOne({
          where: { id: user.companyId },
        });
        post.companyData = company;
      }
      return getStringMailTemplate(listpost, infoUser);
    } else {
      return 0;
    }
  } catch (error) {
    console.log(error);
    return 0;
  }
};

const sendJobMail = () => {
  schedule.scheduleJob(rule, async function () {
    try {
      let listUserGetMail = await db.UserSetting.findAll({
        where: {
          isTakeMail: 1,
        },
        include: [
          {
            model: db.User,
            as: "userSettingData",
            attributes: ["id", "firstName", "lastName", "image"],
            include: [
              {
                model: db.Account,
                as: "userAccountData",
                attributes: ["email"],
              },
            ],
          },
        ],
        raw: true,
        nest: true,
      });

      for (let user of listUserGetMail) {
        let listSkills = await db.UserSkill.findAll({
          where: { userId: user.userId },
          include: db.Skill,
          raw: true,
          nest: true,
        });

        user.listSkills = listSkills.map((item) => {
          return {
            [Op.like]: `%${item.Skill.name}%`,
          };
        });

        let mailTemplate = await getTemplateMail(user);
        if (mailTemplate !== 0 && user.userSettingData.userAccountData.email) {
          sendmail(mailTemplate, user.userSettingData.userAccountData.email);
        }
      }
    } catch (error) {
      console.log(error);
    }
    console.log("đã gửi");
  });
};

// Thêm hàm này cùng level với sendJobMail
const manualTriggerEmail = async (userId) => {
  try {
    console.log(`[DEBUG] Bắt đầu tìm user ID: ${userId}`);
    // Lấy thông tin user cụ thể
    const user = await db.UserSetting.findOne({
      where: {
        userId: userId,
        isTakeMail: 1,
      },
      include: [
        {
          model: db.User,
          as: "userSettingData",
          include: [
            {
              model: db.Account,
              as: "userAccountData",
              attributes: ["email"],
            },
          ],
        },
      ],
      raw: true,
      nest: true,
    });

    console.log("[DEBUG] Thông tin user:", user);

    if (!user) {
      console.log("User không tồn tại hoặc chưa bật chế độ nhận mail");
      return;
    }

    // Lấy danh sách skills
    const listSkills = await db.UserSkill.findAll({
      where: { userId: user.userId },
      include: db.Skill,
      raw: true,
      nest: true,
    });

    user.listSkills = listSkills.map((item) => ({
      [Op.like]: `%${item.Skill.name}%`,
    }));

    // Gửi mail
    const mailTemplate = await getTemplateMail(user);
    if (mailTemplate !== 0 && user.userSettingData.userAccountData.email) {
      await sendmail(mailTemplate, user.userSettingData.userAccountData.email);
      console.log(
        `Đã gửi mail đến ${user.userSettingData.userAccountData.email}`
      );
    } else {
      console.log("Không có công việc phù hợp để gửi");
    }
  } catch (error) {
    console.error("Lỗi khi test gửi mail:", error);
  }
};

// Xuất thêm hàm manualTriggerEmail
module.exports = {
  sendJobMail,
  manualTriggerEmail,
};
