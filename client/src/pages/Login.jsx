import { useState } from "react";

import api from "../services/api";

const Login = () => {

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleLogin = async (e) => {

    e.preventDefault();

    setLoading(true);

    try {

      const res = await api.post(
        "/auth/login",
        {
          email,
          password,
        }
      );

      // SAVE
      localStorage.setItem(
        "token",
        res.data.token
      );

      localStorage.setItem(
        "teacher",
        JSON.stringify(
          res.data.teacher
        )
      );

      // ROLE BASED REDIRECT
      if (
        res.data.teacher.role ===
        "admin"
      ) {

        window.location.href =
          "/admin";

      } else {

        window.location.href =
          "/dashboard";
      }

    } catch (error) {

      alert(
        error.response?.data?.message
      );

    } finally {

      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-green-400 flex items-center justify-center p-4">

      {/* Card */}
      <div className="w-full max-w-md bg-white/20 backdrop-blur-xl border border-white/20 rounded-[35px] p-8 shadow-2xl">

        {/* Logo */}
        <div className="text-center mb-8">

          <div className="w-24 h-24 bg-white mx-auto rounded-full flex items-center justify-center text-4xl shadow-lg mb-5">

            🎓

          </div>

          <h1 className="text-4xl font-bold text-white">

            School App

          </h1>

          <p className="text-white/80 mt-3">

            Daily Class Report System

          </p>

        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >

          {/* Email */}
          <div>

            <label className="block text-white mb-2 font-medium">

              Email

            </label>

            <input
              type="email"
              placeholder="teacher@gmail.com"
              className="w-full bg-white/20 border border-white/20 text-white placeholder:text-white/60 p-4 rounded-2xl outline-none"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
            />

          </div>

          {/* Password */}
          <div>

            <label className="block text-white mb-2 font-medium">

              Password

            </label>

            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-white/20 border border-white/20 text-white placeholder:text-white/60 p-4 rounded-2xl outline-none"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
            />

          </div>

          {/* Button */}
          <button
            disabled={loading}
            className="w-full bg-white text-emerald-600 hover:bg-gray-100 transition py-4 rounded-2xl font-bold text-lg shadow-lg"
          >

            {
              loading
                ? "Logging in..."
                : "Login"
            }

          </button>

        </form>

        {/* Footer */}
        <div className="text-center mt-8 text-white/70 text-sm">

          Developed for School Management

        </div>

      </div>

    </div>
  );
};

export default Login;