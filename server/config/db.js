const mongoose = require("mongoose");

const connectDB = async () => {
  try {

    let uri = process.env.MONGO_URI || "";
    if (!/retryWrites=/.test(uri)) {
      uri += (uri.includes("?") ? "&" : "?") + "retryWrites=false";
    }

    await mongoose.connect(
      uri
    );

    console.log("MongoDB Connected");

    // ---- ExamAttendance multi-day migration ----
    // Previously a student could only be marked once per exam. We now record
    // attendance per exam day, keyed by {exam, student, day}. Backfill legacy
    // records to day 1 and drop the old {exam, student} unique index so a
    // student can be marked again on a later day.
    try {
      await mongoose.model("ExamAttendance").updateMany(
        { day: { $exists: false } },
        { $set: { day: 1, attendanceDate: new Date() } }
      );
      const db = mongoose.connection.db;
      await db.collection("examattendances").dropIndex("exam_1_student_1");
      await mongoose.model("ExamAttendance").syncIndexes();
    } catch (error) {
      console.log("ExamAttendance migration:", error.message);
    }

  } catch (error) {

    console.log(error.message);

    process.exit(1);
  }
};

module.exports = connectDB;