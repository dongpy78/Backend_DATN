const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

// const multer = require("multer");
const connectDB = require("./share/configs/db.connect");
const configviewEngine = require("../config/viewEngine");
const ErrorHandlerMiddleware = require("./v1/middlewares/errorhandle.middleware");

const authRoute = require("./v1/routes/auth.route");
const allcodeRoute = require("./v1/routes/allcode.route");
const skillRoute = require("./v1/routes/skill.route");
const companyRoute = require("./v1/routes/company.route");
const postRoute = require("./v1/routes/post.route");
const cvRoute = require("./v1/routes/cv.route");
const uploadRoute = require("./v1/routes/upload.route");
const userRoute = require("./v1/routes/user.route");
const mediaRoute = require("./v1/routes/media.route");
const packagePostRoute = require("./v1/routes/packagepost.route");
const packageCvRoute = require("./v1/routes/packagecv.route");
const blogRoute = require("./v1/routes/blog.route");

// import { sendJobMail, updateFreeViewCv } from "./utils/schedule";

const { sendJobMail } = require("./share/utils/schedule.utils");
const { manualTriggerEmail } = require("./share/utils/schedule.utils");
// const updateFreeViewCv = require("./share/utils/schedule.utils");

// Khởi tạo app trước khi sử dụng
const app = express();

// Tăng giới hạn payload lên 10MB
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

// const cors = require("cors");
// app.use(cors());

configviewEngine(app);
app.use(cookieParser());
app.use(express.json());
app.use(morgan("dev"));

//! Connect to database
connectDB();

sendJobMail();

//! Routes
// Route mẫu
app.get("/", (req, res) => {
  res.render("index", { title: "Home Page" }); // Render file index.ejs
});

app.get("/test-send-job-mail/:userId", async (req, res) => {
  try {
    await manualTriggerEmail(req.params.userId);
    res.send("Đã kích hoạt gửi mail thủ công");
  } catch (error) {
    res.status(500).send("Lỗi khi test gửi mail: " + error.message);
  }
});

app.use(express.urlencoded({ extended: true }));

// authRoute
app.use("/api/v1/auth", authRoute);
// allcodeRoute
app.use("/api/v1", allcodeRoute);
// skillRoute
app.use("/api/v1", skillRoute);
// companyRoute
app.use("/api/v1", companyRoute);
// postRoute
app.use("/api/v1", postRoute);
// cvRoute
app.use("/api/v1", cvRoute);
// upload
app.use("/api/v1", uploadRoute);
// media
app.use("/api/v1", mediaRoute);
// userRoute
app.use("/api/v1", userRoute);
// packagePostRoute
app.use("/api/v1", packagePostRoute);
// packageCvRoute
app.use("/api/v1", packageCvRoute);

app.use("/api/v1", blogRoute);

app.use("*", (req, res) => {
  res.status(404).json({ msg: "not found" });
});

// HandleMiddleware
app.use(ErrorHandlerMiddleware.errorHandlerMiddleware);

module.exports = app;
