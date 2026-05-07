const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/reportRoutes");
const teacherRoutes = require("./routes/teacherRoutes");

dotenv.config();

connectDB();

const app = express();


// Middlewares
app.use(cors());

app.use(express.json());


// Routes
app.use("/api/auth", authRoutes);

app.use("/api/reports", reportRoutes);

app.use(
  "/api/teachers",
  teacherRoutes
);




// Test Route
app.get("/", (req, res) => {
  res.send("API Running");
});


// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});