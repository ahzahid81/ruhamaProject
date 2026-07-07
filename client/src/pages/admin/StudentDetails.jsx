import {
    useEffect,
    useState,
} from "react";

import {
    Link,
    useParams,
} from "react-router-dom";

import api from "../../services/api";



const StudentDetails = () => {


    const {
        id
    } = useParams();



    const [student, setStudent] =
        useState(null);



    const [loading, setLoading] =
        useState(true);




    const loadStudent = async () => {


        try {


            const res =
                await api.get(
                    `/students/${id}`
                );


            setStudent(
                res.data
            );


        }

        catch (error) {

            console.log(error);

        }

        finally {

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

            <div className="p-10">

                Loading Student Profile...

            </div>

        );

    }





    if (!student) {

        return (

            <div className="p-10">

                Student Not Found

            </div>

        );

    }







    return (

        <div className="max-w-6xl mx-auto student-profile">





            {/* ACTION AREA */}

            <div className="
print:hidden
flex
justify-end
gap-3
mb-5
">


                <Link

                    to={`/students/edit/${student._id}`}

                    className="
bg-emerald-600
text-white
px-5
py-3
rounded-xl
font-semibold
"

                >

                    ✏ Edit

                </Link>




                <button

                    onClick={handlePrint}

                    className="
bg-gray-800
text-white
px-5
py-3
rounded-xl
font-semibold
"

                >

                    🖨 Print

                </button>



            </div>







            {/* PROFILE HEADER */}


            <div className="
bg-gradient-to-r
from-emerald-600
to-teal-500
rounded-3xl
shadow-xl
p-6
text-white
flex
flex-col
md:flex-row
items-center
gap-6
">





                {
                    student.photo

                        ?

                        <img

                            src={student.photo}

                            className="
w-36
h-36
rounded-full
object-cover
border-4
border-white
shadow-lg
"

                        />

                        :

                        <div className="
w-36
h-36
rounded-full
bg-white/20
flex
items-center
justify-center
text-5xl
">

                            👤

                        </div>

                }








                <div className="flex-1">


                    <h1 className="
text-3xl
font-bold
">

                        {student.name}

                    </h1>



                    <p className="
mt-2
opacity-90
">

                        {student.className}

                        {" • "}

                        {student.section}

                        {" • "}

                        {student.session}

                    </p>





                    <div className="
grid
grid-cols-2
md:grid-cols-4
gap-3
mt-6
">


                        <HeaderInfo

                            label="Student ID"

                            value={student.studentId}

                        />



                        <HeaderInfo

                            label="Admission No"

                            value={student.admissionNo}

                        />



                        <HeaderInfo

                            label="Student Type"

                            value={student.studentType}

                        />



                        <HeaderInfo

                            label="Status"

                            value={student.status}

                        />



                    </div>



                </div>



            </div>







            {/* PRINT TITLE */}


            <div className="
hidden
print:block
text-center
mb-6
">


                <h1 className="
text-3xl
font-bold
">

                    Ruhama School

                </h1>


                <h2 className="
text-xl
">

                    Student Profile

                </h2>


            </div>







            {/* PROFILE CONTENT START */}

            <div className="mt-6 space-y-6">
                {/* BASIC INFORMATION */}

                <InfoSection

                    title="🎓 Basic Information"

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





                {/* PERSONAL INFORMATION */}

                <InfoSection

                    title="👤 Personal Information"

                    fields={[

                        ["Gender", student.gender],

                        ["Religion", student.religion],

                        ["Blood Group", student.bloodGroup],

                        ["Nationality", student.nationality],

                        ["Date of Birth", formatDate(student.dateOfBirth)],

                    ]}

                />






                {/* PARENT INFORMATION */}

                <InfoSection

                    title="👨‍👩‍👦 Parent Information"

                    fields={[

                        ["Father Name", student.fatherName],

                        ["Father Mobile", student.fatherMobile],

                        ["Mother Name", student.motherName],

                        ["Mother Mobile", student.motherMobile],

                    ]}

                />






                {/* GUARDIAN INFORMATION */}

                <InfoSection

                    title="👤 Guardian Information"

                    fields={[

                        ["Guardian Name", student.guardianName],

                        ["Guardian Relation", student.guardianRelation],

                        ["Guardian Mobile", student.guardianMobile],

                        ["Emergency Contact", student.emergencyContact],

                    ]}

                />






                {/* ADDRESS */}

                <InfoSection

                    title="🏠 Address Information"

                    fields={[

                        ["Present Address", student.presentAddress],

                        ["Permanent Address", student.permanentAddress],

                    ]}

                />







                {/* ADMISSION INFORMATION */}

                <InfoSection

                    title="📚 Admission Information"

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







// ======================================
// HEADER INFO
// ======================================

const HeaderInfo = ({
    label,
    value,
}) => {


    return (

        <div className="
bg-white/20
rounded-xl
p-3
">


            <p className="
text-xs
opacity-80
">

                {label}

            </p>


            <p className="
font-bold
mt-1
text-sm
">

                {value || "-"}

            </p>


        </div>

    );


};







// ======================================
// INFORMATION SECTION
// ======================================

const InfoSection = ({
    title,
    fields,
}) => {


    return (

        <div className="
bg-white
rounded-3xl
shadow
p-6
print:shadow-none
print:border
">


            <h2 className="
text-xl
font-bold
mb-5
border-b
pb-3
">

                {title}

            </h2>




            <div className="
grid
md:grid-cols-2
lg:grid-cols-3
gap-4
">


                {

                    fields.map(
                        (item, index) => (


                            <div

                                key={index}

                                className="
bg-gray-50
rounded-xl
p-4
break-words
"


                            >


                                <p className="
text-sm
text-gray-500
">

                                    {item[0]}

                                </p>


                                <p className="
font-semibold
mt-1
">

                                    {item[1] || "-"}

                                </p>


                            </div>


                        )

                    )

                }


            </div>


        </div>

    );


};







// ======================================
// DATE FORMAT
// ======================================

const formatDate = (date) => {


    if (!date) {

        return "-";

    }


    return new Date(date)
        .toLocaleDateString("en-GB");


};








export default StudentDetails;