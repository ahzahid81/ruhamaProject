import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../services/api";


const EditStudent = () => {


  const {
    id,
  } = useParams();


  const navigate =
    useNavigate();


  const [loading, setLoading] =
    useState(true);


  const [saving, setSaving] =
    useState(false);


  const [photo, setPhoto] =
    useState(null);


  const [preview, setPreview] =
    useState("");



  const [form, setForm] =
    useState({

      studentId: "",

      name: "",

      className: "",

      section: "A",

      studentType: "Regular",

      gender: "",

      religion: "Islam",

      bloodGroup: "",

      dateOfBirth: "",

      fatherName: "",

      fatherMobile: "",

      motherName: "",

      motherMobile: "",

      presentAddress: "",

      status: "Active",

    });



  // ==========================
  // LOAD STUDENT
  // ==========================

  const loadStudent = async () => {

    try {

      const res =
        await api.get(
          `/students/${id}`
        );


      const student =
        res.data;


      setForm({

        studentId:
          student.studentId || "",

        name:
          student.name || "",

        className:
          student.className || "",

        section:
          student.section || "A",

        studentType:
          student.studentType || "Regular",

        gender:
          student.gender || "",

        religion:
          student.religion || "Islam",

        bloodGroup:
          student.bloodGroup || "",

        dateOfBirth:
          student.dateOfBirth
            ?.substring(0,10) || "",


        fatherName:
          student.fatherName || "",

        fatherMobile:
          student.fatherMobile || "",

        motherName:
          student.motherName || "",

        motherMobile:
          student.motherMobile || "",

        presentAddress:
          student.presentAddress || "",

        status:
          student.status || "Active",

      });


      setPreview(
        student.photo
      );


    }


    catch(error){

      console.log(error);

    }


    finally{

      setLoading(false);

    }


  };



  useEffect(()=>{

    loadStudent();

  },[]);




  // ==========================
  // INPUT CHANGE
  // ==========================

  const handleChange = (e)=>{

    setForm({

      ...form,

      [e.target.name]:
        e.target.value,

    });

  };




  // ==========================
  // PHOTO
  // ==========================

  const handlePhoto = (e)=>{


    const file =
      e.target.files[0];


    if(file){

      setPhoto(file);


      setPreview(
        URL.createObjectURL(file)
      );

    }

  };




  // ==========================
  // SUBMIT
  // ==========================

  const handleSubmit =
  async(e)=>{


    e.preventDefault();


    setSaving(true);


    try{


      const data =
        new FormData();



      Object.keys(form)
      .forEach(
        key=>{

          data.append(
            key,
            form[key]
          );

        }
      );



      if(photo){

        data.append(
          "photo",
          photo
        );

      }



      await api.put(

        `/students/${id}`,

        data,

        {

          headers:{

            "Content-Type":
            "multipart/form-data",

          }

        }

      );



      alert(
        "Student Updated Successfully"
      );


      navigate(
        "/students"
      );


    }


    catch(error){

      console.log(error);


      alert(
        "Update Failed"
      );

    }


    finally{

      setSaving(false);

    }


  };




  if(loading){

    return (

      <div className="p-10">

        Loading...

      </div>

    );

  }




  return (

    <div className="max-w-4xl mx-auto">


      <h1 className="text-3xl font-bold mb-6">

        Edit Student

      </h1>



      <form

        onSubmit={handleSubmit}

        className="bg-white rounded-2xl shadow p-6 space-y-5"

      >


        {/* PHOTO */}

        <div>


          <label className="font-semibold">

            Student Photo

          </label>


          <div className="flex items-center gap-5 mt-3">


            {

              preview &&

              <img

                src={preview}

                className="w-24 h-24 rounded-full object-cover"

              />

            }



            <input

              type="file"

              accept="image/*"

              capture="environment"

              onChange={handlePhoto}

            />


          </div>


        </div>





        <input

          value={form.studentId}

          readOnly

          className="w-full border p-3 rounded-xl bg-gray-100"

        />



        <input

          name="name"

          value={form.name}

          onChange={handleChange}

          placeholder="Student Name"

          className="w-full border p-3 rounded-xl"

        />



        <div className="grid md:grid-cols-2 gap-4">


          <input

            name="fatherName"

            value={form.fatherName}

            onChange={handleChange}

            placeholder="Father Name"

            className="border p-3 rounded-xl"

          />



          <input

            name="fatherMobile"

            value={form.fatherMobile}

            onChange={handleChange}

            placeholder="Father Mobile"

            className="border p-3 rounded-xl"

          />


        </div>



        <textarea

          name="presentAddress"

          value={form.presentAddress}

          onChange={handleChange}

          placeholder="Address"

          className="w-full border p-3 rounded-xl"

        />



        <button

          disabled={saving}

          className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold"

        >

          {

            saving

            ?

            "Saving..."

            :

            "Update Student"

          }


        </button>



      </form>


    </div>

  );


};


export default EditStudent;