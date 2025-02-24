const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const connectDB = require("./share/configs/db.connect");
const configviewEngine = require("../config/viewEngine");

const ErrorHandlerMiddleware = require("./v1/middlewares/errorhandle.middleware");

const authRoute = require("./v1/routes/auth.route");
const allcodeRoute = require("./v1/routes/allcode.route");
const skillRoute = require("./v1/routes/skill.route");
const companyRoute = require("./v1/routes/company.route");
const postRoute = require("./v1/routes/post.route");
const cvRoute = require("./v1/routes/cv.route");

const app = express();
configviewEngine(app);
app.use(cookieParser());
app.use(express.json());
app.use(morgan("dev"));

//! Connect to database
connectDB();

//! Routes
// Route mẫu
app.get("/", (req, res) => {
  res.render("index", { title: "Home Page" }); // Render file index.ejs
});

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

app.use("*", (req, res) => {
  res.status(404).json({ msg: "not found" });
});

// HandleMiddleware
app.use(ErrorHandlerMiddleware.errorHandlerMiddleware);

module.exports = app;
