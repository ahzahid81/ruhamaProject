import {
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import api from "../../services/api";


const StudentAdmission = () => {


    const navigate = useNavigate();


    const [loading, setLoading] =
        useState(false);


    const [photo, setPhoto] =
        useState(null);


    const [preview, setPreview] =
        useState("");



    const [success, setSuccess] =
        useState(null);



    const [form, setForm] =
        useState({

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

        setForm({

            ...form,

            [e.target.name]:
                e.target.value,

        });

    };





    const handlePhoto = (e) => {


        const file =
            e.target.files[0];


        if (file) {

            setPhoto(file);


            setPreview(
                URL.createObjectURL(file)
            );

        }

    };





    const handleSubmit =
        async (e) => {

            e.preventDefault();


            setLoading(true);



            try {


                const data =
                    new FormData();



                Object.entries(form)
                    .forEach(([key, value]) => {

                        data.append(
                            key,
                            value
                        );

                    });



                if (photo) {

                    data.append(
                        "photo",
                        photo
                    );

                }



                const res =
                    await api.post(

                        "/students/create",

                        data,

                        {

                            headers: {

                                "Content-Type":
                                    "multipart/form-data",

                            },

                        }

                    );



                setSuccess({

                    studentId:
                        res.data.student.studentId,

                    admissionNo:
                        res.data.student.admissionNo,

                    password:
                        res.data.student.plainPassword,

                });



            }


            catch (error) {


                console.log(error);


                alert(

                    error.response?.data?.message
                    ||

                    "Admission Failed"

                );


            }


            finally {

                setLoading(false);

            }


        };





    const Input = ({
        label,
        name,
        type = "text",
    }) => (

        <div>

            <label className="text-sm font-semibold text-gray-600">

                {label}

            </label>


            <input

                type={type}

                name={name}

                value={form[name]}

                onChange={handleChange}

                className="
        w-full mt-1 px-4 py-3
        rounded-xl border
        focus:outline-none
        focus:ring-2
        focus:ring-emerald-500
        "

            />

        </div>

    );






    return (

        <div className="max-w-6xl mx-auto space-y-6">



            {/* HEADER */}

            <div className="
bg-white rounded-3xl shadow p-6
border
">

                <h1 className="text-3xl font-bold">

                    🎓 Student Admission

                </h1>


                <p className="text-gray-500 mt-2">

                    Create new student profile

                </p>


            </div>






            <form
                onSubmit={handleSubmit}
                className="space-y-6"
            >




                {/* PROFILE */}

                <div className="
bg-white rounded-3xl shadow p-6
">

                    <h2 className="text-xl font-bold mb-5">

                        📷 Student Photo

                    </h2>


                    <div className="flex items-center gap-6">


                        {

                            preview ?

                                <img

                                    src={preview}

                                    className="
w-32 h-32 rounded-full
object-cover border
"

                                />

                                :

                                <div className="
w-32 h-32 rounded-full
bg-gray-100 flex items-center
justify-center text-4xl
">

                                    👤

                                </div>

                        }



                        <input

                            type="file"

                            accept="image/*"

                            capture="environment"

                            onChange={handlePhoto}

                        />


                    </div>


                </div>






                {/* BASIC */}

                <div className="
bg-white rounded-3xl shadow p-6
">

                    <h2 className="text-xl font-bold mb-5">

                        👨‍🎓 Student Information

                    </h2>


                    <div className="grid md:grid-cols-3 gap-5">


                        <Input
                            label="Student Name"
                            name="name"
                        />


                        <div>

                            <label className="text-sm font-semibold">

                                Class

                            </label>


                            <select

                                name="className"

                                value={form.className}

                                onChange={handleChange}

                                className="w-full mt-1 px-4 py-3 rounded-xl border"

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



                        <Input
                            label="Section"
                            name="section"
                        />



                    </div>



                    <div className="grid md:grid-cols-4 gap-5 mt-5">


                        <Input
                            label="Date of Birth"
                            name="dateOfBirth"
                            type="date"
                        />


                        <Input
                            label="Blood Group"
                            name="bloodGroup"
                        />



                        <Input
                            label="Religion"
                            name="religion"
                        />



                        <Input
                            label="Nationality"
                            name="nationality"
                        />


                    </div>


                </div>






                {/* PARENTS */}

                <div className="
bg-white rounded-3xl shadow p-6
">

                    <h2 className="text-xl font-bold mb-5">

                        👨‍👩‍👦 Parent Information

                    </h2>


                    <div className="grid md:grid-cols-2 gap-5">


                        <Input
                            label="Father Name"
                            name="fatherName"
                        />


                        <Input
                            label="Father Mobile"
                            name="fatherMobile"
                        />


                        <Input
                            label="Mother Name"
                            name="motherName"
                        />


                        <Input
                            label="Mother Mobile"
                            name="motherMobile"
                        />


                    </div>


                </div>






                {/* GUARDIAN */}

                <div className="
bg-white rounded-3xl shadow p-6
">

                    <h2 className="text-xl font-bold mb-5">

                        Guardian Information

                    </h2>


                    <div className="grid md:grid-cols-3 gap-5">


                        <Input
                            label="Guardian Name"
                            name="guardianName"
                        />


                        <Input
                            label="Relation"
                            name="guardianRelation"
                        />


                        <Input
                            label="Guardian Mobile"
                            name="guardianMobile"
                        />


                    </div>

                </div>







                {/* ADDRESS */}

                <div className="
bg-white rounded-3xl shadow p-6
">

                    <h2 className="text-xl font-bold mb-5">

                        🏠 Address

                    </h2>


                    <textarea

                        name="presentAddress"

                        placeholder="Present Address"

                        value={form.presentAddress}

                        onChange={handleChange}

                        className="w-full border rounded-xl p-4 mb-4"

                    />



                    <textarea

                        name="permanentAddress"

                        placeholder="Permanent Address"

                        value={form.permanentAddress}

                        onChange={handleChange}

                        className="w-full border rounded-xl p-4"

                    />


                </div>







                {/* ACCOUNT */}

                <div className="
bg-white rounded-3xl shadow p-6
">

                    <h2 className="text-xl font-bold mb-5">

                        🔐 Login Information

                    </h2>


                    <Input

                        label="Password (Optional)"

                        name="password"

                    />


                    <p className="text-sm text-gray-500 mt-2">

                        Empty রাখলে Father Mobile Number Password হবে।

                    </p>


                </div>







                <button

                    disabled={loading}

                    className="
bg-emerald-600
hover:bg-emerald-700
text-white
px-10 py-4
rounded-2xl
font-bold
shadow-lg
"

                >


                    {

                        loading

                            ?

                            "Saving..."

                            :

                            "Admit Student"

                    }


                </button>




            </form>






            {/* SUCCESS */}

            {

                success &&

                <div className="
fixed inset-0 bg-black/40
flex items-center justify-center
">


                    <div className="
bg-white rounded-3xl
p-8 shadow-xl
w-full max-w-md
">


                        <h2 className="text-2xl font-bold text-emerald-600">

                            Admission Successful 🎉

                        </h2>


                        <div className="mt-5 space-y-3">


                            <p>

                                Student ID:

                                <br />

                                <b>{success.studentId}</b>

                            </p>


                            <p>

                                Admission No:

                                <br />

                                <b>{success.admissionNo}</b>

                            </p>


                            <p>

                                Password:

                                <br />

                                <b>{success.password}</b>

                            </p>


                        </div>



                        <button

                            onClick={() => navigate("/students")}

                            className="
mt-6 bg-emerald-600
text-white px-6 py-3
rounded-xl
"

                        >

                            Go Student List

                        </button>


                    </div>


                </div>

            }


        </div>

    );


};


export default StudentAdmission;