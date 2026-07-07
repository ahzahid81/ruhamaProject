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


  const [students, setStudents] = useState([]);

  const [loading, setLoading] =
    useState(true);


  const [activeClass, setActiveClass] =
    useState("All Students");


  const [search, setSearch] =
    useState("");



  const loadStudents = async () => {

    try {

      setLoading(true);


      let url =
        "/students";


      if (
        activeClass !==
        "All Students"
      ) {

        url +=
          `?className=${activeClass}`;

      }


      const response =
        await api.get(url);


      setStudents(
        response.data
      );


    }

    catch(error){

      console.log(
        error
      );

    }

    finally{

      setLoading(false);

    }

  };



  useEffect(()=>{

    loadStudents();

  },[activeClass]);




  const filteredStudents =
    students.filter(
      (student)=>{

        const text =
          search.toLowerCase();


        return (

          student.name
            ?.toLowerCase()
            .includes(text)

          ||

          student.studentId
            ?.toLowerCase()
            .includes(text)

          ||

          student.fatherMobile
            ?.includes(search)

        );

      }
    );



  return (

    <div>


      <div className="mb-6">


        <h1 className="text-3xl font-bold">

          Student Management

        </h1>


        <p className="text-gray-500 mt-2">

          Manage all students

        </p>


      </div>





      {/* Class Menu */}

      <div className="bg-white rounded-2xl shadow p-4 mb-6">


        <div className="flex flex-wrap gap-3">


          {
            classes.map(
              (item)=>(


                <button

                  key={item}

                  onClick={()=>
                    setActiveClass(item)
                  }

                  className={`px-5 py-3 rounded-xl font-semibold transition

                  ${
                    activeClass === item

                    ?

                    "bg-emerald-600 text-white"

                    :

                    "bg-gray-100 hover:bg-gray-200"

                  }

                  `}

                >

                  {item}


                </button>


              )
            )
          }


        </div>


      </div>





      {/* Search */}


      <div className="bg-white rounded-2xl shadow p-4 mb-6">


        <input

          type="text"

          placeholder="Search Student Name / ID / Mobile"

          value={search}

          onChange={
            (e)=>
            setSearch(e.target.value)
          }


          className="w-full border rounded-xl px-5 py-3 outline-none"

        />


      </div>






      {/* Table */}


      <div className="bg-white rounded-2xl shadow overflow-x-auto">


        {

          loading ?

          (

            <div className="p-10 text-center">

              Loading Students...

            </div>

          )


          :


          (


          <table className="w-full">


            <thead className="bg-gray-100">


              <tr>


                <th className="p-4 text-left">

                  Photo

                </th>


                <th className="p-4 text-left">

                  Student ID

                </th>


                <th className="p-4 text-left">

                  Name

                </th>


                <th className="p-4 text-left">

                  Class

                </th>


                <th className="p-4 text-left">

                  Father

                </th>


                <th className="p-4 text-left">

                  Mobile

                </th>


                <th className="p-4">

                  Action

                </th>


              </tr>


            </thead>





            <tbody>


              {

                filteredStudents.map(

                  (student)=>(


                    <tr

                      key={
                        student._id
                      }

                      className="border-t hover:bg-gray-50"


                    >


                      <td className="p-4">


                        {

                          student.photo ?

                          (

                            <img

                              src={
                                student.photo
                              }

                              alt={
                                student.name
                              }

                              className="w-12 h-12 rounded-full object-cover"

                            />

                          )

                          :

                          (

                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">

                              👤

                            </div>

                          )

                        }


                      </td>




                      <td className="p-4 font-semibold">

                        {
                          student.studentId
                        }

                      </td>




                      <td className="p-4">

                        {
                          student.name
                        }

                      </td>




                      <td className="p-4">

                        {
                          student.className
                        }

                      </td>




                      <td className="p-4">

                        {
                          student.fatherName
                        }

                      </td>




                      <td className="p-4">

                        {
                          student.fatherMobile
                        }

                      </td>




                      <td className="p-4">


                        <Link

                          to={`/students/edit/${student._id}`}

                          className="bg-blue-600 text-white px-4 py-2 rounded-lg"

                        >

                          Edit

                        </Link>


                      </td>


                    </tr>


                  )

                )

              }



            </tbody>



          </table>


          )

        }



      </div>



    </div>

  );

};


export default Students;