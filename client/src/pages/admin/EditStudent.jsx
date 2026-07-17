import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../../services/api";
import {
  Camera,
  Lock,
  User,
  Users,
  Phone,
  MapPin,
  Calendar,
  Save,
  ArrowLeft,
  Loader2,
} from "lucide-react";

const Input = ({ label, name, type = "text", value, onChange, disabled = false }) => {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
          disabled
            ? "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
            : "bg-white text-gray-900 border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50"
        }`}
      />
    </div>
  );
};

const EditStudent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [form, setForm] = useState({});

  const loadStudent = async () => {
    try {
      const res = await api.get(`/students/${id}`);
      setForm(res.data);
      setPreview(res.data.photo);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudent();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

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
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-sm font-semibold cursor-pointer">
            <Camera className="w-4 h-4" />
            Change Photo
            <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
          </label>
        </div>
      ),
    },
    {
      title: "System Information",
      icon: Lock,
      iconBg: "bg-gray-50",
      iconColor: "text-gray-600",
      content: (
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Student ID" name="studentId" value={form.studentId} disabled />
          <Input label="Admission No" name="admissionNo" value={form.admissionNo} disabled />
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
            <Input label="Name" name="name" value={form.name} onChange={handleChange} />
            <Input label="Roll" name="roll" value={form.roll} onChange={handleChange} />
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Class</label>
              <select
                name="className"
                value={form.className || ""}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
              >
                <option value="Play Group">Play Group</option>
                <option value="Nursery">Nursery</option>
                <option value="KG">KG</option>
                <option value="STD-I">STD-I</option>
                <option value="STD-II">STD-II</option>
                <option value="STD-III">STD-III</option>
                <option value="STD-IV">STD-IV</option>
                <option value="STD-V">STD-V</option>
              </select>
            </div>
            <Input label="Section" name="section" value={form.section} onChange={handleChange} />
            <Input label="Session" name="session" value={form.session} onChange={handleChange} />
          </div>
        </div>
      ),
    },
    {
      title: "Personal Information",
      icon: User,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      content: (
        <div className="grid md:grid-cols-3 gap-4">
          <Input label="Gender" name="gender" value={form.gender} onChange={handleChange} />
          <Input label="Religion" name="religion" value={form.religion} onChange={handleChange} />
          <Input label="Blood Group" name="bloodGroup" value={form.bloodGroup} onChange={handleChange} />
          <Input label="Nationality" name="nationality" value={form.nationality} onChange={handleChange} />
          <Input
            label="Date of Birth"
            name="dateOfBirth"
            type="date"
            value={form.dateOfBirth ? form.dateOfBirth.substring(0, 10) : ""}
            onChange={handleChange}
          />
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
      icon: Phone,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      content: (
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Input label="Guardian Name" name="guardianName" value={form.guardianName} onChange={handleChange} />
            <Input label="Guardian Relation" name="guardianRelation" value={form.guardianRelation} onChange={handleChange} />
            <Input label="Guardian Mobile" name="guardianMobile" value={form.guardianMobile} onChange={handleChange} />
          </div>
          <Input label="Emergency Contact" name="emergencyContact" value={form.emergencyContact} onChange={handleChange} />
        </div>
      ),
    },
    {
      title: "Address",
      icon: MapPin,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
      content: (
        <div className="space-y-4">
          <textarea
            name="presentAddress"
            value={form.presentAddress || ""}
            onChange={handleChange}
            placeholder="Present Address"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all resize-none"
            rows={3}
          />
          <textarea
            name="permanentAddress"
            value={form.permanentAddress || ""}
            onChange={handleChange}
            placeholder="Permanent Address"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all resize-none"
            rows={3}
          />
        </div>
      ),
    },
    {
      title: "Admission Information",
      icon: Calendar,
      iconBg: "bg-cyan-50",
      iconColor: "text-cyan-600",
      content: (
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Input
              label="Admission Date"
              name="admissionDate"
              type="date"
              value={form.admissionDate ? form.admissionDate.substring(0, 10) : ""}
              onChange={handleChange}
            />
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Status</label>
              <select
                name="status"
                value={form.status || "Active"}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
              >
                <option>Active</option>
                <option>Inactive</option>
                <option>Completed</option>
                <option>TC</option>
              </select>
            </div>
          </div>
          <textarea
            name="remarks"
            value={form.remarks || ""}
            onChange={handleChange}
            placeholder="Remarks"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all resize-none"
            rows={3}
          />
        </div>
      ),
    },
    {
      title: "Password",
      icon: Lock,
      iconBg: "bg-gray-50",
      iconColor: "text-gray-600",
      content: (
        <div>
          <Input label="Password" name="plainPassword" value={form.plainPassword} onChange={handleChange} />
          <p className="text-xs text-gray-400 mt-2">নতুন Password না দিলে আগের Password থাকবে।</p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Edit Student</h1>
            <p className="mt-1.5 text-indigo-200 text-sm md:text-base">Update student information</p>
          </div>
          <Link
            to={`/students/${id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </div>

      <form className="space-y-4">
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
            type="button"
            disabled={saving}
            onClick={async () => {
              try {
                setSaving(true);
                const data = new FormData();
                Object.entries(form).forEach(([key, value]) => {
                  data.append(key, value || "");
                });
                if (photo) {
                  data.append("photo", photo);
                }
                await api.put(`/students/${id}`, data, {
                  headers: { "Content-Type": "multipart/form-data" },
                });
                alert("Student Updated Successfully");
                navigate(`/students/${id}`);
              } catch (error) {
                console.log(error);
                alert("Update Failed");
              } finally {
                setSaving(false);
              }
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Update Student
              </>
            )}
          </button>
          <Link
            to={`/students/${id}`}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-semibold transition-all border border-gray-100"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default EditStudent;
