import {
    useEffect,
    useState,
} from "react";

import api from "../services/api";

const ProxyReport = () => {

    const teacher =
        JSON.parse(
            localStorage.getItem(
                "teacher"
            )
        );

    const [teachers,
        setTeachers] =
        useState([]);

    const [
        selectedTeacher,
        setSelectedTeacher,
    ] = useState(null);

    const [
        selectedAssignment,
        setSelectedAssignment,
    ] = useState(null);

    const [classWork,
        setClassWork] =
        useState("");

    const [homeWork,
        setHomeWork] =
        useState("");

    const [date,
        setDate] =
        useState(
            new Date()
                .toISOString()
                .split("T")[0]
        );

    const [loading,
        setLoading] =
        useState(false);

    useEffect(() => {

        loadTeachers();

    }, []);

    const loadTeachers =
        async () => {


            try {

                const res =
                    await api.get(
                        "/teachers"
                    );

                setTeachers(
                    res.data.filter(
                        (t) =>
                            t._id !==
                            teacher._id
                    )
                );

            } catch (error) {

                console.log(error);
            }
        };


    const handleSubmit =
        async (e) => {


            e.preventDefault();

            if (
                !selectedTeacher ||
                !selectedAssignment
            ) {

                return alert(
                    "Select teacher and assignment"
                );
            }

            try {

                setLoading(true);

                await api.post(
                    "/reports/create",
                    {
                        subject:
                            selectedAssignment.subject,

                        className:
                            selectedAssignment.className,

                        date,

                        classWork,

                        homeWork,

                        teacherId:
                            selectedTeacher._id,

                        takenBy:
                            teacher._id,
                    }
                );

                alert(
                    "Proxy Report Created Successfully"
                );

                setClassWork("");
                setHomeWork("");
                setSelectedAssignment(
                    null
                );

            } catch (error) {

                alert(
                    error.response?.data
                        ?.message
                );

            } finally {

                setLoading(false);
            }
        };


    return (


        <div className="space-y-6">

            {/* SELECT TEACHER */}
            <div className="bg-white rounded-[30px] p-6 shadow-sm">

                <h2 className="text-2xl font-black mb-5">

                    Select Teacher

                </h2>

                <select
                    className="w-full border rounded-2xl p-4"
                    onChange={(e) => {

                        const found =
                            teachers.find(
                                (t) =>
                                    t._id ===
                                    e.target.value
                            );

                        setSelectedTeacher(
                            found
                        );

                        setSelectedAssignment(
                            null
                        );
                    }}
                >

                    <option value="">
                        Select Teacher
                    </option>

                    {teachers.map(
                        (t) => (

                            <option
                                key={t._id}
                                value={t._id}
                            >

                                {t.name}

                            </option>

                        )
                    )}

                </select>

            </div>

            {/* ASSIGNMENTS */}
            {selectedTeacher && (

                <div className="bg-white rounded-[30px] p-6 shadow-sm">

                    <h2 className="text-2xl font-black mb-5">

                        Select Assignment

                    </h2>

                    <div className="grid md:grid-cols-2 gap-4">

                        {selectedTeacher.assignments.map(
                            (
                                item,
                                index
                            ) => (

                                <button
                                    key={index}
                                    type="button"
                                    onClick={() =>
                                        setSelectedAssignment(
                                            item
                                        )
                                    }
                                    className={`border rounded-3xl p-5 text-left

              ${selectedAssignment
                                            ?.subject ===
                                            item.subject &&
                                            selectedAssignment
                                                ?.className ===
                                            item.className

                                            ? "bg-blue-900 text-white"

                                            : "bg-white"
                                        }`}
                                >

                                    <h3 className="text-2xl font-black">

                                        {item.subject}

                                    </h3>

                                    <p className="mt-2">

                                        {item.className}

                                    </p>

                                </button>

                            )
                        )}

                    </div>

                </div>

            )}

            {/* FORM */}
            {selectedAssignment && (

                <form
                    onSubmit={
                        handleSubmit
                    }
                    className="bg-white rounded-[30px] p-6 shadow-sm space-y-5"
                >

                    <input
                        type="date"
                        value={date}
                        onChange={(e) =>
                            setDate(
                                e.target.value
                            )
                        }
                        className="border rounded-2xl p-4 w-full"
                    />

                    <textarea
                        rows={6}
                        placeholder="Class Work"
                        value={classWork}
                        onChange={(e) =>
                            setClassWork(
                                e.target.value
                            )
                        }
                        className="border rounded-2xl p-4 w-full"
                    />

                    <textarea
                        rows={6}
                        placeholder="Home Work"
                        value={homeWork}
                        onChange={(e) =>
                            setHomeWork(
                                e.target.value
                            )
                        }
                        className="border rounded-2xl p-4 w-full"
                    />

                    <button
                        disabled={loading}
                        className="w-full bg-blue-900 text-white py-4 rounded-2xl font-bold"
                    >

                        {
                            loading
                                ? "Submitting..."
                                : "Submit Proxy Report"
                        }

                    </button>

                </form>

            )}

        </div>

    );
};

export default ProxyReport;
