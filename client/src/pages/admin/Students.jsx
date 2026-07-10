import {
    useEffect,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import api from "../../services/api";



const classes = [

    "All Students",

    "Play Group",

    "Nursery",

    "KG",

    "STD-I",

    "STD-II",

    "STD-III",

    "STD-IV",

    "STD-V",

];





const Students = () => {


    const [students, setStudents] =
        useState([]);



    const [activeClass, setActiveClass] =
        useState("All Students");



    const [loading, setLoading] =
        useState(true);




    const loadStudents = async () => {


        try {


            const res =
                await api.get(
                    "/students"
                );


            setStudents(
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

        loadStudents();

    }, []);







    const filteredStudents =

        activeClass === "All Students"

            ?

            students

            :

            students.filter(

                student =>

                    student.className === activeClass

            );








    const handleDelete = async (id) => {


        const confirmDelete =
            window.confirm(
                "Delete this student?"
            );



        if (!confirmDelete)
            return;




        try {


            await api.delete(
                `/students/${id}`
            );


            setStudents(

                students.filter(

                    student =>
                        student._id !== id

                )

            );



        }

        catch (error) {

            console.log(error);

        }


    };








    if (loading) {

        return (

            <div className="p-10">

                Loading Students...

            </div>

        );

    }








    return (

        <div className="
space-y-6
">






            {/* HEADER */}

            <div className="
bg-white
rounded-3xl
shadow
p-6
flex
justify-between
items-center
">


                <div>

                    <h1 className="
text-3xl
font-bold
">

                        👨‍🎓 Students

                    </h1>


                    <p className="
text-gray-500
mt-2
">

                        Manage student records

                    </p>


                </div>




                <Link

                    to="/student-admission"

                    className="
bg-emerald-600
text-white
px-6
py-3
rounded-xl
font-semibold
"

                >

                    + New Admission

                </Link>



            </div>








            {/* CLASS MENU */}

            <div className="
bg-white
rounded-3xl
shadow
p-4
flex
gap-3
overflow-x-auto
">


                {

                    classes.map(item => (


                        <button

                            key={item}

                            onClick={() => setActiveClass(item)}

                            className={`

px-5
py-3
rounded-xl
font-semibold
whitespace-nowrap


${activeClass === item

                                    ?

                                    "bg-emerald-600 text-white"

                                    :

                                    "bg-gray-100"

                                }


`}

                        >


                            {item}


                        </button>


                    ))

                }


            </div>







            {/* COUNT */}

            <div className="
bg-emerald-50
rounded-2xl
p-5
font-semibold
">


                Showing:

                {" "}

                {filteredStudents.length}

                {" "}

                Students


            </div>







            {/* STUDENT GRID */}

            <div className="
grid
md:grid-cols-2
xl:grid-cols-3
gap-6
">
                {

                    filteredStudents.map(student => (


                        <div

                            key={student._id}

                            className="
          bg-white
          rounded-3xl
          shadow
          p-6
          hover:shadow-xl
          transition
          "


                        >





                            {/* PHOTO + BASIC */}


                            <div className="
          flex
          items-center
          gap-4
          ">


                                {

                                    student.photo

                                        ?

                                        <img

                                            src={student.photo}

                                            className="
              w-20
              h-20
              rounded-full
              object-cover
              border
              "

                                        />


                                        :

                                        <div

                                            className="
              w-20
              h-20
              rounded-full
              bg-gray-100
              flex
              items-center
              justify-center
              text-3xl
              "

                                        >

                                            👤

                                        </div>

                                }



                                <div>


                                    <h2 className="
              font-bold
              text-lg
              ">

                                        {student.name}

                                    </h2>



                                    <p className="
              text-sm
              text-gray-500
              ">

                                        {student.studentId}

                                    </p>



                                </div>


                            </div>








                            {/* INFORMATION */}


                            <div className="
          mt-5
          space-y-2
          text-sm
          ">


                                <p>

                                    🎓 Class:

                                    <b>

                                        {" "}

                                        {student.className}

                                    </b>

                                </p>



                                <p>

                                    🔢 Roll:

                                    <b>

                                        {" "}

                                        {student.roll || "-"}

                                    </b>

                                </p>



                                <p>

                                    👨 Father:

                                    <b>

                                        {" "}

                                        {student.fatherName}

                                    </b>

                                </p>



                                <p>

                                    📞 Mobile:

                                    <b>

                                        {" "}

                                        {student.fatherMobile}

                                    </b>

                                </p>



                                <p>


                                    Status:


                                    <span className={`

              ml-2
              px-3
              py-1
              rounded-full
              text-xs
              font-semibold


              ${student.status === "Active"

                                            ?

                                            "bg-green-100 text-green-700"

                                            :

                                            "bg-red-100 text-red-700"

                                        }

              `}>


                                        {student.status}


                                    </span>


                                </p>



                            </div>









                            {/* ACTION BUTTONS */}


                            <div className="mt-6 grid grid-cols-2 gap-3">

                                <Link
                                    to={`/students/${student._id}`}
                                    className="
        text-center
        bg-blue-600
        hover:bg-blue-700
        text-white
        py-3
        rounded-xl
        font-semibold
        transition
        "
                                >
                                    👁 View
                                </Link>

                                <Link
                                    to={`/students/edit/${student._id}`}
                                    className="
        text-center
        bg-emerald-600
        hover:bg-emerald-700
        text-white
        py-3
        rounded-xl
        font-semibold
        transition
        "
                                >
                                    ✏ Edit
                                </Link>

                                <Link
                                    to={`/collect-payment?studentId=${student.studentId}`}
                                    className="
        text-center
        bg-amber-500
        hover:bg-amber-600
        text-white
        py-3
        rounded-xl
        font-semibold
        transition
        "
                                >
                                    💰 Collect Payment
                                </Link>

                                <Link
                                    to={`/exam/admit-card?studentId=${student.studentId}`}
                                    className="
        text-center
        bg-purple-600
        hover:bg-purple-700
        text-white
        py-3
        rounded-xl
        font-semibold
        transition
        "
                                >
                                    🎫 Admit Card
                                </Link>

                                <button
                                    onClick={() => handleDelete(student._id)}
                                    className="
        col-span-2
        bg-red-500
        hover:bg-red-600
        text-white
        py-3
        rounded-xl
        font-semibold
        transition
        "
                                >
                                    🗑 Delete Student
                                </button>

                            </div>



                        </div>


                    ))

                }



                {

                    filteredStudents.length === 0

                    &&

                    <div className="
        col-span-full
        bg-white
        rounded-3xl
        shadow
        p-10
        text-center
        text-gray-500
        ">

                        No Student Found

                    </div>

                }



            </div>




        </div>

    );

};


export default Students;