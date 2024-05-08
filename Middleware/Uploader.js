const multer = require("multer");
const uploader = multer({
  dest: "images/",
  limits: { fileSize: 1024 * 1024 * 10 },
});


module.exports = { uploader };
