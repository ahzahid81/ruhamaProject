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

const {

createSubject,

getSubjects,

updateSubject,

deleteSubject,

bulkSetSubjects,

} = require("../controllers/examSubjectController");

const {

getStudentsForMarks,

saveMarks,

getResults,

getResult,

publishResults,

} = require("../controllers/examResultController");

// =====================================
// EXAM SETTINGS
// =====================================

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

// =====================================
// EXAM SUBJECTS
// =====================================

router.post(
"/:examId/subjects/bulk",
protect,
authorizeRoles("admin"),
bulkSetSubjects
);

router.post(
"/:examId/subjects",
protect,
authorizeRoles("admin"),
createSubject
);

router.get(
"/:examId/subjects",
protect,
getSubjects
);

router.put(
"/:examId/subjects/:subjectId",
protect,
authorizeRoles("admin"),
updateSubject
);

router.delete(
"/:examId/subjects/:subjectId",
protect,
authorizeRoles("admin"),
deleteSubject
);

// =====================================
// EXAM RESULTS / MARKS
// =====================================

router.get(
"/:examId/students",
protect,
getStudentsForMarks
);

router.post(
"/:examId/results/save",
protect,
saveMarks
);

router.get(
"/:examId/results",
protect,
getResults
);

router.get(
"/:examId/results/student/:studentId",
protect,
getResult
);

router.post(
"/:examId/results/publish",
protect,
authorizeRoles("admin"),
publishResults
);

module.exports = router;
