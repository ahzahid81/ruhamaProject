import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit3,
  Printer,
  GraduationCap,
  Hash,
  Users,
  Shield,
  FileText,
  BookOpen,
  ArrowLeft,
} from "lucide-react";

const HeaderInfo = ({ label, value }) => (
  <div className="bg-white/15 rounded-lg p-2.5 backdrop-blur-sm">
    <p className="text-[10px] text-white/70 uppercase tracking-wider">{label}</p>
    <p className="font-semibold text-white text-sm mt-0.5 truncate">{value || "-"}</p>
  </div>
);

const InfoSection = ({ title, icon: Icon, iconBg, fields }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 print:shadow-none print:border">
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-50">
      <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
        <Icon className="w-4.5 h-4.5 text-gray-600" />
      </div>
      <h2 className="text-sm font-bold text-gray-900">{title}</h2>
    </div>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
      {fields.map((item, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{item[0]}</p>
          <p className="font-semibold text-gray-900 text-sm mt-0.5 break-words">{item[1] || "-"}</p>
        </div>
      ))}
    </div>
  </div>
);

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB");
};

const StudentDetails = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStudent = async () => {
    try {
      const res = await api.get(`/students/${id}`);
      setStudent(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudent();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <User className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-400">Student not found</p>
        <Link to="/students" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 student-profile">
      {/* Actions */}
      <div className="print:hidden flex items-center justify-between gap-3">
        <Link
          to="/students"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-semibold transition-colors border border-gray-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to={`/students/edit/${student._id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm font-semibold transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {student.photo ? (
            <img src={student.photo} className="w-28 h-28 rounded-2xl object-cover border-4 border-white/30 shadow-lg" />
          ) : (
            <div className="w-28 h-28 rounded-2xl bg-white/10 flex items-center justify-center border-2 border-white/20">
              <User className="w-12 h-12 text-white/50" />
            </div>
          )}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-white">{student.name}</h1>
            <p className="text-indigo-200 text-sm mt-1">
              {student.className} &bull; {student.section} &bull; {student.session}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-5">
              <HeaderInfo label="Student ID" value={student.studentId} />
              <HeaderInfo label="Admission No" value={student.admissionNo} />
              <HeaderInfo label="Student Type" value={student.studentType} />
              <HeaderInfo label="Status" value={student.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Print Title */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold">Ruhama School</h1>
        <h2 className="text-lg">Student Profile</h2>
      </div>

      {/* Info Sections */}
      <div className="space-y-4">
        <InfoSection
          title="Basic Information"
          icon={GraduationCap}
          iconBg="bg-indigo-50"
          fields={[
            ["Student ID", student.studentId],
            ["Admission No", student.admissionNo],
            ["Name", student.name],
            ["Roll", student.roll],
            ["Class", student.className],
            ["Section", student.section],
            ["Session", student.session],
            ["Student Type", student.studentType],
            ["Status", student.status],
          ]}
        />

        <InfoSection
          title="Personal Information"
          icon={User}
          iconBg="bg-blue-50"
          fields={[
            ["Gender", student.gender],
            ["Religion", student.religion],
            ["Blood Group", student.bloodGroup],
            ["Nationality", student.nationality],
            ["Date of Birth", formatDate(student.dateOfBirth)],
          ]}
        />

        <InfoSection
          title="Parent Information"
          icon={Users}
          iconBg="bg-emerald-50"
          fields={[
            ["Father Name", student.fatherName],
            ["Father Mobile", student.fatherMobile],
            ["Mother Name", student.motherName],
            ["Mother Mobile", student.motherMobile],
          ]}
        />

        <InfoSection
          title="Guardian Information"
          icon={Phone}
          iconBg="bg-amber-50"
          fields={[
            ["Guardian Name", student.guardianName],
            ["Guardian Relation", student.guardianRelation],
            ["Guardian Mobile", student.guardianMobile],
            ["Emergency Contact", student.emergencyContact],
          ]}
        />

        <InfoSection
          title="Address Information"
          icon={MapPin}
          iconBg="bg-rose-50"
          fields={[
            ["Present Address", student.presentAddress],
            ["Permanent Address", student.permanentAddress],
          ]}
        />

        <InfoSection
          title="Admission Information"
          icon={Calendar}
          iconBg="bg-cyan-50"
          fields={[
            ["Admission Date", formatDate(student.admissionDate)],
            ["Remarks", student.remarks],
            ["Created At", formatDate(student.createdAt)],
            ["Updated At", formatDate(student.updatedAt)],
          ]}
        />
      </div>
    </div>
  );
};

export default StudentDetails;
