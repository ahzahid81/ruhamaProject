import { useState, useEffect } from "react";
import api from "../../services/api";
import { getSettings, clearSettingsCache } from "../../services/settingsCache";

const STRING_KEYS = ["sections", "subjects", "paymentMethods", "academicSessions"];

const LABELS = {
  classes: "Classes",
  sections: "Sections",
  subjects: "Subjects",
  examNames: "Exam Names",
  paymentMethods: "Payment Methods",
  academicSessions: "Academic Sessions",
};

const HELPERS = {
  classes: "Each class has a name and a short code used in student ID generation (e.g. Nursery → N).",
  sections: "Section labels available for class division.",
  subjects: "Subject names used for teacher assignments, marks entry, and exam subjects.",
  examNames: "Exam types used for Per Exam fees and admit cards.",
  paymentMethods: "Payment options available in the collection form.",
  academicSessions: "Academic years shown in dropdowns.",
};

export default function SystemSettings() {
  const [settings, setSettings] = useState(null);
  const [examNames, setExamNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState("classes");

  const [newClass, setNewClass] = useState({ name: "", code: "" });
  const [editClass, setEditClass] = useState(null);
  const [newItem, setNewItem] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [newExamName, setNewExamName] = useState("");
  const [editExam, setEditExam] = useState(null);

  useEffect(() => {
    getSettings()
      .then((res) => setSettings(res.data))
      .catch(() => setMessage({ text: "Failed to load settings from the server.", type: "error" }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api
      .get("/exam-names")
      .then((res) => setExamNames(res.data))
      .catch(() => {});
  }, []);

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const applySettings = (doc) => {
    setSettings(doc);
    setEditClass(null);
    setEditItem(null);
    clearSettingsCache();
  };

  const addItem = async (key) => {
    if (key === "classes") {
      if (!newClass.name.trim() || !newClass.code.trim()) return;
      try {
        const res = await api.post("/settings/classes", {
          name: newClass.name,
          code: newClass.code,
        });
        applySettings(res.data);
        setNewClass({ name: "", code: "" });
        showMessage("Class added");
      } catch (err) {
        showMessage(err.response?.data?.message || "Failed to add", "error");
      }
      return;
    }
    if (!newItem.trim()) return;
    try {
      const res = await api.post(`/settings/${key}`, { name: newItem });
      applySettings(res.data);
      setNewItem("");
      showMessage(`${LABELS[key]} — item added`);
    } catch (err) {
      showMessage(err.response?.data?.message || "Failed to add", "error");
    }
  };

  const saveEdit = async () => {
    try {
      let res;
      if (activeTab === "classes") {
        res = await api.put(`/settings/classes/${editClass.index}`, {
          name: editClass.name,
          code: editClass.code,
        });
        showMessage("Class updated");
      } else {
        res = await api.put(`/settings/${activeTab}/${editItem.index}`, {
          name: editItem.name,
        });
        showMessage(`${LABELS[activeTab]} — item updated`);
      }
      applySettings(res.data);
    } catch (err) {
      showMessage(err.response?.data?.message || "Failed to save", "error");
    }
  };

  const deleteItem = async (index, label) => {
    if (!window.confirm(`Delete "${label}"?`)) return;
    try {
      const res = await api.delete(`/settings/${activeTab}/${index}`);
      applySettings(res.data);
      showMessage("Deleted");
    } catch (err) {
      showMessage(err.response?.data?.message || "Failed to delete", "error");
    }
  };

  const addExamName = async () => {
    const name = newExamName.trim();
    if (!name) return;
    try {
      const res = await api.post("/exam-names", { name });
      setExamNames([...examNames, res.data]);
      setNewExamName("");
      showMessage("Exam name added");
    } catch (err) {
      showMessage(err.response?.data?.message || "Failed to add", "error");
    }
  };

  const saveExamName = async () => {
    try {
      const res = await api.put(`/exam-names/${editExam.id}`, { name: editExam.name });
      setExamNames(examNames.map((e) => (e._id === editExam.id ? { ...e, name: res.data.name } : e)));
      setEditExam(null);
      showMessage("Exam name updated");
    } catch (err) {
      showMessage(err.response?.data?.message || "Failed to update", "error");
    }
  };

  const deleteExamName = async (id, name) => {
    if (!window.confirm(`Delete exam name "${name}"?\n\nExam fees already recorded keep their name.`)) return;
    try {
      await api.delete(`/exam-names/${id}`);
      setExamNames(examNames.filter((e) => e._id !== id));
      showMessage("Exam name deleted");
    } catch (err) {
      showMessage(err.response?.data?.message || "Failed to delete", "error");
    }
  };

  const changeCurrentSession = async (value) => {
    setSettings({ ...settings, currentSession: value });
    try {
      const res = await api.put("/settings/current-session", { currentSession: value });
      setSettings(res.data);
      showMessage("Active session updated");
    } catch (err) {
      showMessage(err.response?.data?.message || "Failed to update session", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading from database...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Failed to load settings from the database. Check your connection and try again.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-800">System Settings</h1>
        <span className="text-xs text-gray-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Loaded from database — changes save immediately
        </span>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl mb-4 font-semibold ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.keys(LABELS).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition ${
              activeTab === tab ? "bg-indigo-600 text-white shadow" : "bg-white text-gray-600 hover:bg-gray-100 border"
            }`}
          >
            {LABELS[tab]}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500 mb-4">{HELPERS[activeTab]}</p>

      {/* Classes */}
      {activeTab === "classes" && (
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-700">Manage Classes</h2>
            <span className="text-sm text-gray-400">{settings.classes.length} class{settings.classes.length !== 1 && "es"}</span>
          </div>

          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="Class name (e.g. Nursery)"
              value={newClass.name}
              onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && addItem("classes")}
              className="flex-1 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="text"
              placeholder="Code (e.g. N)"
              value={newClass.code}
              onChange={(e) => setNewClass({ ...newClass, code: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && addItem("classes")}
              maxLength={5}
              className="w-24 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
            />
            <button onClick={() => addItem("classes")} className="px-5 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition">
              Add
            </button>
          </div>

          {settings.classes.length === 0 ? (
            <p className="text-gray-400 text-center py-6">No classes defined. Add the classes above.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-sm text-gray-500">
                  <th className="pb-3 font-semibold">#</th>
                  <th className="pb-3 font-semibold">Class Name</th>
                  <th className="pb-3 font-semibold">Code</th>
                  <th className="pb-3 font-semibold">Order</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {settings.classes.map((c, i) => {
                  const editing = editClass?.index === i;
                  return (
                    <tr key={i} className="border-b last:border-none hover:bg-gray-50">
                      <td className="py-3">{i + 1}</td>
                      <td className="py-3">
                        {editing ? (
                          <input
                            autoFocus
                            type="text"
                            value={editClass.name}
                            onChange={(e) => setEditClass({ ...editClass, name: e.target.value })}
                            className="border rounded-lg p-2 w-full max-w-[180px] outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        ) : (
                          <span className="font-semibold">{c.name}</span>
                        )}
                      </td>
                      <td className="py-3">
                        {editing ? (
                          <input
                            type="text"
                            value={editClass.code}
                            onChange={(e) => setEditClass({ ...editClass, code: e.target.value })}
                            maxLength={5}
                            className="border rounded-lg p-2 w-20 outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                          />
                        ) : (
                          <span className="font-mono font-bold text-indigo-600">{c.code}</span>
                        )}
                      </td>
                      <td className="py-3 text-gray-500">{c.order || i + 1}</td>
                      <td className="py-3 text-right">
                        {editing ? (
                          <div className="flex gap-2 justify-end">
                            <button onClick={saveEdit} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition">Save</button>
                            <button onClick={() => setEditClass(null)} className="px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-300 transition">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setEditClass({ index: i, name: c.name, code: c.code })}
                              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteItem(i, c.name)}
                              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* String-list tabs */}
      {STRING_KEYS.includes(activeTab) && (
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-700">Manage {LABELS[activeTab]}</h2>
            <span className="text-sm text-gray-400">{(settings[activeTab] || []).length} item{(settings[activeTab] || []).length !== 1 && "s"}</span>
          </div>

          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder={`Add new ${LABELS[activeTab].slice(0, -1).toLowerCase()}...`}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem(activeTab)}
              className="flex-1 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button onClick={() => addItem(activeTab)} className="px-5 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition">
              Add
            </button>
          </div>

          {(settings[activeTab] || []).length === 0 ? (
            <p className="text-gray-400 text-center py-6">No items defined. Add them above.</p>
          ) : (
            <ul className="space-y-2">
              {(settings[activeTab] || []).map((item, i) => (
                <li key={i} className="flex items-center justify-between gap-3 bg-gray-50 border rounded-xl px-4 py-2.5">
                  {editItem?.index === i ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        autoFocus
                        type="text"
                        value={editItem.name}
                        onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                        className="flex-1 border rounded-xl p-2 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button onClick={saveEdit} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition">Save</button>
                      <button onClick={() => setEditItem(null)} className="px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-300 transition">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-gray-700">{item}</span>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => setEditItem({ index: i, name: item })}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteItem(i, item)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Exam Names */}
      {activeTab === "examNames" && (
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-slate-700">Manage Exam Names</h2>
            <span className="text-sm text-gray-400">{examNames.length} exam name{examNames.length !== 1 && "s"}</span>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            These are the exam types used for "Per Exam" fees and admit cards. Saved directly to the database.
          </p>

          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="e.g. First Summative"
              value={newExamName}
              onChange={(e) => setNewExamName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addExamName()}
              className="flex-1 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button onClick={addExamName} className="px-5 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition">
              Add
            </button>
          </div>

          {examNames.length === 0 ? (
            <p className="text-gray-400 text-center py-6">No exam names yet. Add your school's exam types above.</p>
          ) : (
            <ul className="space-y-2">
              {examNames.map((e) => (
                <li key={e._id} className="flex items-center justify-between gap-3 bg-gray-50 border rounded-xl px-4 py-2.5">
                  {editExam?.id === e._id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        autoFocus
                        type="text"
                        value={editExam.name}
                        onChange={(ev) => setEditExam({ ...editExam, name: ev.target.value })}
                        onKeyDown={(ev) => ev.key === "Enter" && saveExamName()}
                        className="flex-1 border rounded-xl p-2 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button onClick={saveExamName} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition">Save</button>
                      <button onClick={() => setEditExam(null)} className="px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-300 transition">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-gray-700">{e.name}</span>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => setEditExam({ id: e._id, name: e.name })} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition">
                          Edit
                        </button>
                        <button onClick={() => deleteExamName(e._id, e.name)} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition">
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Active Session */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mt-6">
        <h2 className="text-lg font-bold text-slate-700 mb-4">Active Session</h2>
        <select
          value={settings.currentSession || ""}
          onChange={(e) => changeCurrentSession(e.target.value)}
          className="border rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-semibold"
        >
          {(settings.academicSessions || []).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <p className="text-sm text-gray-400 mt-2">
          This session is used as the default when creating new students and fee structures.
        </p>
      </div>
    </div>
  );
}