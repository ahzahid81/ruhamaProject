const express = require("express");

const router = express.Router();

const {

protect,

authorizeRoles,

} = require("../middlewares/authMiddleware");

const {

createExam,

getExams,

getExam,

updateExam,

deleteExam,

} = require("../controllers/examSettingController");

router.post(
"/",
protect,
authorizeRoles("admin"),
createExam
);

router.get(
"/",
protect,
getExams
);

router.get(
"/:id",
protect,
getExam
);

router.put(
"/:id",
protect,
authorizeRoles("admin"),
updateExam
);

router.delete(
"/:id",
protect,
authorizeRoles("admin"),
deleteExam
);

module.exports = router;