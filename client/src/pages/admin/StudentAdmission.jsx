import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  UserPlus,
  Camera,
  User,
  Users,
  Phone,
  Shield,
  MapPin,
  FileText,
  CheckCircle,
  X,
  ArrowLeft,
} from "lucide-react";

const Input = ({ label, name, type = "text", value, onChange }) => {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
      />
    </div>
  );
};

const StudentAdmission = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    name: "",
    className: "KG",
    section: "A",
    studentType: "Regular",
    gender: "Male",
    religion: "Islam",
    bloodGroup: "",
    nationality: "Bangladeshi",
    dateOfBirth: "",
    fatherName: "",
    fatherMobile: "",
    motherName: "",
    motherMobile: "",
    guardianName: "",
    guardianRelation: "",
    guardianMobile: "",
    emergencyContact: "",
    presentAddress: "",
    permanentAddress: "",
    admissionDate: "",
    password: "",
    remarks: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        data.append(key, value);
      });
      if (photo) {
        data.append("photo", photo);
      }
      const res = await api.post("/students/create", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess({
        studentId: res.data.student.studentId,
        admissionNo: res.data.student.admissionNo,
        password: res.data.student.plainPassword,
      });
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Admission Failed");
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    {
      title: "Student Photo",
      icon: Camera,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      content: (
        <div className="flex items-center gap-6">
          {preview ? (
            <img src={preview} className="w-24 h-24 rounded-xl object-cover border border-gray-200" />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200">
              <Camera className="w-8 h-8 text-gray-300" />
            </div>
          )}
          <div>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-sm font-semibold cursor-pointer">
              <Camera className="w-4 h-4" />
              Upload Photo
              <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
            </label>
          </div>
        </div>
      ),
    },
    {
      title: "Student Information",
      icon: User,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      content: (
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Input label="Student Name" name="name" value={form.name} onChange={handleChange} />
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Class</label>
              <select
                name="className"
                value={form.className}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
              >
                <option>Play Group</option>
                <option>Nursery</option>
                <option>KG</option>
                <option>STD-I</option>
                <option>STD-II</option>
                <option>STD-III</option>
                <option>STD-IV</option>
                <option>STD-V</option>
              </select>
            </div>
            <Input label="Section" name="section" value={form.section} onChange={handleChange} />
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <Input label="Date of Birth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} />
            <Input label="Blood Group" name="bloodGroup" value={form.bloodGroup} onChange={handleChange} />
            <Input label="Religion" name="religion" value={form.religion} onChange={handleChange} />
            <Input label="Nationality" name="nationality" value={form.nationality} onChange={handleChange} />
          </div>
        </div>
      ),
    },
    {
      title: "Student Category",
      icon: Users,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      content: (
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Student Type</label>
            <select
              name="studentType"
              value={form.studentType}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
            >
              <option>Regular</option>
              <option>Day Care</option>
              <option>Hostel</option>
              <option>Hifzul Quran</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Gender</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
            >
              <option>Male</option>
              <option>Female</option>
            </select>
          </div>
        </div>
      ),
    },
    {
      title: "Parent Information",
      icon: Users,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      content: (
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Father Name" name="fatherName" value={form.fatherName} onChange={handleChange} />
          <Input label="Father Mobile" name="fatherMobile" value={form.fatherMobile} onChange={handleChange} />
          <Input label="Mother Name" name="motherName" value={form.motherName} onChange={handleChange} />
          <Input label="Mother Mobile" name="motherMobile" value={form.motherMobile} onChange={handleChange} />
        </div>
      ),
    },
    {
      title: "Guardian Information",
      icon: User,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      content: (
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Input label="Guardian Name" name="guardianName" value={form.guardianName} onChange={handleChange} />
            <Input label="Relation" name="guardianRelation" value={form.guardianRelation} onChange={handleChange} />
            <Input label="Guardian Mobile" name="guardianMobile" value={form.guardianMobile} onChange={handleChange} />
          </div>
          <Input label="Emergency Contact" name="emergencyContact" value={form.emergencyContact} onChange={handleChange} />
        </div>
      ),
    },
    {
      title: "Address Information",
      icon: MapPin,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
      content: (
        <div className="space-y-4">
          <textarea
            name="presentAddress"
            value={form.presentAddress}
            onChange={handleChange}
            placeholder="Present Address"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all resize-none"
            rows={3}
          />
          <textarea
            name="permanentAddress"
            value={form.permanentAddress}
            onChange={handleChange}
            placeholder="Permanent Address"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all resize-none"
            rows={3}
          />
        </div>
      ),
    },
    {
      title: "Login Information",
      icon: Shield,
      iconBg: "bg-cyan-50",
      iconColor: "text-cyan-600",
      content: (
        <div>
          <Input label="Password (Optional)" name="password" value={form.password} onChange={handleChange} />
          <p className="text-xs text-gray-400 mt-2">
            Password খালি রাখলে Father Mobile Number default password হবে।
          </p>
        </div>
      ),
    },
    {
      title: "Remarks",
      icon: FileText,
      iconBg: "bg-gray-50",
      iconColor: "text-gray-600",
      content: (
        <textarea
          name="remarks"
          value={form.remarks}
          onChange={handleChange}
          placeholder="Remarks"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all resize-none"
          rows={3}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Student Admission</h1>
          <p className="mt-1.5 text-indigo-200 text-sm md:text-base">Create new student profile</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-9 h-9 rounded-lg ${section.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-4.5 h-4.5 ${section.iconColor}`} />
                </div>
                <h2 className="text-sm font-bold text-gray-900">{section.title}</h2>
              </div>
              {section.content}
            </div>
          );
        })}

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Admit Student
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate("/students")}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-semibold transition-all border border-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </form>

      {/* Success Modal */}
      {success && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Admission Successful</h2>
              <p className="text-sm text-gray-400 mt-1">Student has been registered</p>
            </div>
            <div className="space-y-3 bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Student ID</span>
                <span className="font-semibold text-gray-900">{success.studentId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Admission No</span>
                <span className="font-semibold text-gray-900">{success.admissionNo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Password</span>
                <span className="font-semibold text-gray-900 font-mono">{success.password}</span>
              </div>
            </div>
            <button
              onClick={() => navigate("/students")}
              className="mt-6 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all"
            >
              Go to Student List
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAdmission;
