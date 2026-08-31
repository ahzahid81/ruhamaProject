const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const compression = require("compression");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/reportRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const studentRoutes = require("./routes/studentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const examSettingRoutes = require("./routes/examSettingRoutes");
const feeSettingRoutes = require("./routes/feeSettingRoutes");
const studentLedgerRoutes = require("./routes/studentLedgerRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const studentPortalRoutes = require("./routes/studentPortalRoutes");
const publicRoutes = require("./routes/publicRoutes");
const eventRoutes = require("./routes/eventRoutes");


dotenv.config();

connectDB();

const app = express();

app.use(cors());

app.use(express.json());

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

app.use(compression());

app.use("/api/auth", authRoutes);

app.use("/api/reports", reportRoutes);

app.use("/api/teachers", teacherRoutes);

app.use("/api/students", studentRoutes);

app.use("/api/payments", paymentRoutes);

app.use("/api/exams", examSettingRoutes);

app.use("/api/fees", feeSettingRoutes);

app.use("/api/ledger", studentLedgerRoutes);

app.use("/api/settings", settingsRoutes);

app.use("/api/attendance", attendanceRoutes);

app.use("/api/student-portal", studentPortalRoutes);

app.use("/api/public", publicRoutes);

app.use("/api/events", eventRoutes);

app.get("/", (req, res) => {
  res.send("API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
