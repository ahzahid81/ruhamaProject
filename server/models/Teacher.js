const mongoose =
  require("mongoose");

const assignmentSchema =
  new mongoose.Schema({

    subject: String,

    className: String,

  });

const teacherSchema =
  new mongoose.Schema(
    {

      name: {
        type: String,
      },

      email: {
        type: String,
      },

      password: {
        type: String,
      },

      role: {
        type: String,

        enum: [
          "admin",
          "teacher",
        ],

        default: "teacher",
      },

      assignments: [
        assignmentSchema,
      ],
    },

    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "Teacher",
    teacherSchema
  );