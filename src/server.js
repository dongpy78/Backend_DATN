const app = require("./app/app");
require("dotenv").config(); // Đọc biến môi trường từ file .env
const appConfig = require("./app/share/configs/app.config");

// server -> app -> routes -> controllers -> services -> Models
const PORT = appConfig.Port || 3001;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
