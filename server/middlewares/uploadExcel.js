const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {

  const allowedTypes = [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  if (allowedTypes.includes(file.mimetype)) {

    cb(null, true);

  } else {

    cb(new Error("Only Excel files are allowed."), false);

  }

};

const uploadExcel = multer({

  storage,

  fileFilter,

  limits: {

    fileSize: 10 * 1024 * 1024,

  },

});

module.exports = uploadExcel;