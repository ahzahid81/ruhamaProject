import {
  useEffect,
  useState,
} from "react";

import api from "../services/api";

const Teachers = () => {

  const [teachers,
    setTeachers] =
    useState([]);

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password,
    setPassword] =
    useState("");

  const [role, setRole] =
    useState("teacher");

  const [selectedSubjects,
    setSelectedSubjects] =
    useState([]);

  const [selectedClasses,
    setSelectedClasses] =
    useState([]);

  const [assignments,
    setAssignments] =
    useState([]);


  // SUBJECTS
  const subjects = [
    "Arabic",
    "Math",
    "English",
    "Bangla",
    "GK",
    "Science",
    "ICT",
    "MDP",
  ];


  // CLASSES
  const classes = [
    "Play Group",
    "Nursery",
    "KG",
    "Class 1",
    "Class 2",
    "Class 3",
  ];


  // LOAD TEACHERS
  const getTeachers = async () => {

    try {

      const res =
        await api.get(
          "/teachers"
        );

      setTeachers(res.data);

    } catch (error) {

      console.log(error);
    }
  };


  useEffect(() => {
    getTeachers();
  }, []);


  // TOGGLE SUBJECT
  const toggleSubject = (
    subject
  ) => {

    if (
      selectedSubjects.includes(
        subject
      )
    ) {

      setSelectedSubjects(
        selectedSubjects.filter(
          (item) =>
            item !== subject
        )
      );

    } else {

      setSelectedSubjects([
        ...selectedSubjects,
        subject,
      ]);
    }
  };


  // TOGGLE CLASS
  const toggleClass = (
    className
  ) => {

    if (
      selectedClasses.includes(
        className
      )
    ) {

      setSelectedClasses(
        selectedClasses.filter(
          (item) =>
            item !== className
        )
      );

    } else {

      setSelectedClasses([
        ...selectedClasses,
        className,
      ]);
    }
  };


  // GENERATE ASSIGNMENTS
  const generateAssignments =
    () => {

      let generated = [];

      selectedSubjects.forEach(
        (subject) => {

          selectedClasses.forEach(
            (className) => {

              generated.push({
                subject,
                className,
              });
            }
          );
        }
      );

      // Remove duplicates
      const unique =
        generated.filter(
          (
            item,
            index,
            self
          ) =>
            index ===
            self.findIndex(
              (t) =>
                t.subject ===
                  item.subject &&
                t.className ===
                  item.className
            )
        );

      setAssignments(unique);
    };


  // REMOVE ASSIGNMENT
  const removeAssignment = (
    index
  ) => {

    const updated =
      assignments.filter(
        (_, i) =>
          i !== index
      );

    setAssignments(updated);
  };


  // CREATE TEACHER
  const createTeacher = async (
    e
  ) => {

    e.preventDefault();

    if (
      assignments.length === 0
    ) {

      return alert(
        "Generate assignments first"
      );
    }

    try {

      await api.post(
        "/teachers/create",
        {
          name,
          email,
          password,
          role,
          assignments,
        }
      );

      alert(
        "Teacher Created"
      );

      setName("");
      setEmail("");
      setPassword("");
      setRole("teacher");

      setSelectedSubjects(
        []
      );

      setSelectedClasses(
        []
      );

      setAssignments([]);

      getTeachers();

    } catch (error) {

      alert(
        error.response?.data
          ?.message
      );
    }
  };


  // EDIT TEACHER
  const editTeacher = async (
    teacher
  ) => {

    const name =
      prompt(
        "Edit Name",
        teacher.name
      );

    const email =
      prompt(
        "Edit Email",
        teacher.email
      );

    const role =
      prompt(
        "Edit Role (admin/teacher)",
        teacher.role
      );

    if (
      !name ||
      !email ||
      !role
    ) return;

    try {

      await api.put(
        `/teachers/${teacher._id}`,
        {
          name,
          email,
          role,
          assignments:
            teacher.assignments,
        }
      );

      alert(
        "Teacher Updated"
      );

      getTeachers();

    } catch (error) {

      console.log(error);
    }
  };


  // DELETE
  const deleteTeacher = async (
    id
  ) => {

    const confirmDelete =
      window.confirm(
        "Delete Teacher?"
      );

    if (!confirmDelete) return;

    try {

      await api.delete(
        `/teachers/${id}`
      );

      alert(
        "Teacher Deleted"
      );

      getTeachers();

    } catch (error) {

      console.log(error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-500 text-white p-8 rounded-[35px] shadow-lg mb-6">

        <h1 className="text-4xl md:text-5xl font-bold">

          Teacher Management

        </h1>

        <p className="mt-3 text-lg opacity-90">

          Smart Multi Assignment System

        </p>

      </div>

      {/* Form */}
      <div className="bg-white rounded-[30px] p-6 shadow-sm mb-6">

        <h2 className="text-2xl font-bold mb-6">

          Create Teacher

        </h2>

        <form
          onSubmit={
            createTeacher
          }
          className="space-y-6"
        >

          {/* Inputs */}
          <div className="grid md:grid-cols-4 gap-4">

            <input
              type="text"
              placeholder="Teacher Name"
              className="border p-4 rounded-2xl"
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
            />

            <input
              type="email"
              placeholder="Email"
              className="border p-4 rounded-2xl"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
            />

            <input
              type="password"
              placeholder="Password"
              className="border p-4 rounded-2xl"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
            />

            {/* Role */}
            <select
              className="border p-4 rounded-2xl"
              value={role}
              onChange={(e) =>
                setRole(
                  e.target.value
                )
              }
            >

              <option value="teacher">
                Teacher
              </option>

              <option value="admin">
                Admin
              </option>

            </select>

          </div>

          {/* Subjects */}
          <div>

            <h3 className="font-bold text-lg mb-4">

              Select Subjects

            </h3>

            <div className="flex flex-wrap gap-3">

              {subjects.map(
                (
                  subject,
                  index
                ) => (

                  <button
                    type="button"
                    key={index}
                    onClick={() =>
                      toggleSubject(
                        subject
                      )
                    }
                    className={`px-5 py-3 rounded-full font-medium transition
                      
                      ${
                        selectedSubjects.includes(
                          subject
                        )
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-100"
                      }`}
                  >

                    {subject}

                  </button>

                )
              )}

            </div>

          </div>

          {/* Classes */}
          <div>

            <h3 className="font-bold text-lg mb-4">

              Select Classes

            </h3>

            <div className="flex flex-wrap gap-3">

              {classes.map(
                (
                  className,
                  index
                ) => (

                  <button
                    type="button"
                    key={index}
                    onClick={() =>
                      toggleClass(
                        className
                      )
                    }
                    className={`px-5 py-3 rounded-full font-medium transition
                      
                      ${
                        selectedClasses.includes(
                          className
                        )
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100"
                      }`}
                  >

                    {className}

                  </button>

                )
              )}

            </div>

          </div>

          {/* Generate */}
          <button
            type="button"
            onClick={
              generateAssignments
            }
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-2xl font-semibold"
          >

            Generate Assignments

          </button>

          {/* Assignment List */}
          <div className="flex flex-wrap gap-3">

            {assignments.map(
              (
                item,
                index
              ) => (

                <div
                  key={index}
                  className="bg-emerald-100 text-emerald-700 px-5 py-3 rounded-full flex items-center gap-3"
                >

                  <span>

                    {item.subject}
                    {" - "}
                    {item.className}

                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      removeAssignment(
                        index
                      )
                    }
                    className="text-red-500 font-bold"
                  >

                    ✕

                  </button>

                </div>

              )
            )}

          </div>

          {/* Submit */}
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-semibold">

            Create Teacher

          </button>

        </form>

      </div>

      {/* Teachers */}
      <div className="space-y-5">

        {teachers.map(
          (teacher) => (

            <div
              key={teacher._id}
              className="bg-white rounded-[30px] p-6 shadow-sm"
            >

              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-5">

                <div>

                  <h2 className="text-2xl font-bold">

                    {teacher.name}

                  </h2>

                  <p className="text-gray-500 mt-1">

                    {teacher.email}

                  </p>

                  <div className="mt-3">

                    <span
                      className={`px-4 py-2 rounded-full text-sm font-medium
                        
                        ${
                          teacher.role ===
                          "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                    >

                      {teacher.role}

                    </span>

                  </div>

                </div>

                {/* Buttons */}
                <div className="flex gap-3">

                  <button
                    onClick={() =>
                      editTeacher(
                        teacher
                      )
                    }
                    className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-3 rounded-2xl w-fit"
                  >

                    Edit

                  </button>

                  <button
                    onClick={() =>
                      deleteTeacher(
                        teacher._id
                      )
                    }
                    className="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-2xl w-fit"
                  >

                    Delete

                  </button>

                </div>

              </div>

              {/* Assignments */}
              <div className="flex flex-wrap gap-3">

                {teacher.assignments.map(
                  (
                    item,
                    index
                  ) => (

                    <div
                      key={index}
                      className="bg-emerald-100 text-emerald-700 px-5 py-3 rounded-full"
                    >

                      {item.subject}
                      {" - "}
                      {item.className}

                    </div>

                  )
                )}

              </div>

            </div>

          )
        )}

      </div>

    </div>
  );
};

export default Teachers;