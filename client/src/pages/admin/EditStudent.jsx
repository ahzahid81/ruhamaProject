import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../services/api";



// ================================
// INPUT COMPONENT
// ================================

const Input = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  disabled = false,
}) => {


  return (

    <div>


      <label className="
      text-sm
      font-semibold
      text-gray-600
      ">

        {label}

      </label>


      <input

        type={type}

        name={name}

        value={value || ""}

        onChange={onChange}

        disabled={disabled}

        className={`
        w-full
        mt-1
        px-4
        py-3
        rounded-xl
        border

        ${disabled
            ?
            "bg-gray-100 cursor-not-allowed"
            :
            "bg-white"
          }

        focus:outline-none
        focus:ring-2
        focus:ring-emerald-500
        `}

      />


    </div>

  );

};







const EditStudent = () => {


  const {
    id
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
    useState({});






  // ================================
  // LOAD STUDENT
  // ================================


  const loadStudent = async () => {


    try {


      const res =
        await api.get(
          `/students/${id}`
        );


      setForm(
        res.data
      );


      setPreview(
        res.data.photo
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







  const handleChange = (e) => {


    const {
      name,
      value
    } = e.target;



    setForm(prev => ({

      ...prev,

      [name]: value,

    }));


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








  if (loading) {

    return (

      <div className="p-10">

        Loading Student...

      </div>

    );

  }







  return (

    <div className="
max-w-6xl
mx-auto
space-y-6
">






      {/* HEADER */}

      <div className="
bg-white
rounded-3xl
shadow
p-6
">


        <h1 className="
text-3xl
font-bold
">

          ✏ Edit Student

        </h1>


        <p className="text-gray-500 mt-2">

          Update student information

        </p>


      </div>









      <form className="space-y-6">








        {/* PHOTO */}

        <div className="
bg-white
rounded-3xl
shadow
p-6
">


          <h2 className="
text-xl
font-bold
mb-5
">

            📷 Student Photo

          </h2>




          <div className="
flex
items-center
gap-6
">


            {

              preview

                ?

                <img

                  src={preview}

                  className="
w-32
h-32
rounded-full
object-cover
border
"

                />

                :

                <div className="
w-32
h-32
rounded-full
bg-gray-100
flex
items-center
justify-center
text-4xl
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










        {/* LOCKED INFORMATION */}

        <div className="
bg-white
rounded-3xl
shadow
p-6
">


          <h2 className="
text-xl
font-bold
mb-5
">

            🔒 System Information

          </h2>



          <div className="
grid
md:grid-cols-2
gap-5
">


            <Input

              label="Student ID"

              name="studentId"

              value={form.studentId}

              disabled

            />



            <Input

              label="Admission No"

              name="admissionNo"

              value={form.admissionNo}

              disabled

            />


          </div>


        </div>









        {/* BASIC INFORMATION */}

        <div className="
bg-white
rounded-3xl
shadow
p-6
">


          <h2 className="
text-xl
font-bold
mb-5
">

            🎓 Student Information

          </h2>




          <div className="
grid
md:grid-cols-3
gap-5
">



            <Input

              label="Name"

              name="name"

              value={form.name}

              onChange={handleChange}

            />



            <Input

              label="Roll"

              name="roll"

              value={form.roll}

              onChange={handleChange}

            />



            <div>

              <label className="
text-sm
font-semibold
">

                Class

              </label>


              <select

                name="className"

                value={form.className || ""}

                onChange={handleChange}

                className="
w-full
mt-1
px-4
py-3
rounded-xl
border
bg-white
focus:outline-none
focus:ring-2
focus:ring-emerald-500
"

              >


                <option value="Play Group">
                  Play Group
                </option>


                <option value="Nursery">
                  Nursery
                </option>


                <option value="KG">
                  KG
                </option>


                <option value="STD-I">
                  STD-I
                </option>


                <option value="STD-II">
                  STD-II
                </option>


                <option value="STD-III">
                  STD-III
                </option>


                <option value="STD-IV">
                  STD-IV
                </option>


                <option value="STD-V">
                  STD-V
                </option>


              </select>


            </div>



            <Input

              label="Section"

              name="section"

              value={form.section}

              onChange={handleChange}

            />



            <Input

              label="Session"

              name="session"

              value={form.session}

              onChange={handleChange}

            />



          </div>



        </div>
        {/* PERSONAL INFORMATION */}

        <div className="
bg-white
rounded-3xl
shadow
p-6
">


          <h2 className="
text-xl
font-bold
mb-5
">

            👤 Personal Information

          </h2>



          <div className="
grid
md:grid-cols-3
gap-5
">


            <Input

              label="Gender"

              name="gender"

              value={form.gender}

              onChange={handleChange}

            />



            <Input

              label="Religion"

              name="religion"

              value={form.religion}

              onChange={handleChange}

            />



            <Input

              label="Blood Group"

              name="bloodGroup"

              value={form.bloodGroup}

              onChange={handleChange}

            />



            <Input

              label="Nationality"

              name="nationality"

              value={form.nationality}

              onChange={handleChange}

            />



            <Input

              label="Date of Birth"

              name="dateOfBirth"

              type="date"

              value={
                form.dateOfBirth
                  ?
                  form.dateOfBirth.substring(0, 10)
                  :
                  ""
              }

              onChange={handleChange}

            />



          </div>


        </div>









        {/* PARENT INFORMATION */}


        <div className="
bg-white
rounded-3xl
shadow
p-6
">


          <h2 className="
text-xl
font-bold
mb-5
">

            👨‍👩‍👦 Parent Information

          </h2>



          <div className="
grid
md:grid-cols-2
gap-5
">


            <Input

              label="Father Name"

              name="fatherName"

              value={form.fatherName}

              onChange={handleChange}

            />



            <Input

              label="Father Mobile"

              name="fatherMobile"

              value={form.fatherMobile}

              onChange={handleChange}

            />



            <Input

              label="Mother Name"

              name="motherName"

              value={form.motherName}

              onChange={handleChange}

            />



            <Input

              label="Mother Mobile"

              name="motherMobile"

              value={form.motherMobile}

              onChange={handleChange}

            />



          </div>


        </div>









        {/* GUARDIAN INFORMATION */}


        <div className="
bg-white
rounded-3xl
shadow
p-6
">


          <h2 className="
text-xl
font-bold
mb-5
">

            👤 Guardian Information

          </h2>




          <div className="
grid
md:grid-cols-3
gap-5
">


            <Input

              label="Guardian Name"

              name="guardianName"

              value={form.guardianName}

              onChange={handleChange}

            />



            <Input

              label="Guardian Relation"

              name="guardianRelation"

              value={form.guardianRelation}

              onChange={handleChange}

            />



            <Input

              label="Guardian Mobile"

              name="guardianMobile"

              value={form.guardianMobile}

              onChange={handleChange}

            />



          </div>





          <div className="mt-5">


            <Input

              label="Emergency Contact"

              name="emergencyContact"

              value={form.emergencyContact}

              onChange={handleChange}

            />


          </div>



        </div>









        {/* ADDRESS */}


        <div className="
bg-white
rounded-3xl
shadow
p-6
">


          <h2 className="
text-xl
font-bold
mb-5
">

            🏠 Address

          </h2>



          <textarea

            name="presentAddress"

            value={
              form.presentAddress || ""
            }

            onChange={handleChange}

            placeholder="Present Address"

            className="
w-full
border
rounded-xl
p-4
mb-4
"

          />




          <textarea

            name="permanentAddress"

            value={
              form.permanentAddress || ""
            }

            onChange={handleChange}

            placeholder="Permanent Address"

            className="
w-full
border
rounded-xl
p-4
"

          />



        </div>









        {/* ADMISSION & STATUS */}


        <div className="
bg-white
rounded-3xl
shadow
p-6
">


          <h2 className="
text-xl
font-bold
mb-5
">

            📚 Admission Information

          </h2>



          <div className="
grid
md:grid-cols-3
gap-5
">


            <Input

              label="Admission Date"

              name="admissionDate"

              type="date"

              value={
                form.admissionDate
                  ?
                  form.admissionDate.substring(0, 10)
                  :
                  ""
              }

              onChange={handleChange}

            />





            <div>


              <label className="
text-sm
font-semibold
">

                Status

              </label>


              <select

                name="status"

                value={
                  form.status || "Active"
                }

                onChange={handleChange}

                className="
w-full
mt-1
px-4
py-3
rounded-xl
border
"

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

            value={
              form.remarks || ""
            }

            onChange={handleChange}

            placeholder="Remarks"

            className="
w-full
border
rounded-xl
p-4
mt-5
"

          />



        </div>









        {/* PASSWORD */}


        <div className="
bg-white
rounded-3xl
shadow
p-6
">


          <h2 className="
text-xl
font-bold
mb-5
">

            🔐 Password

          </h2>




          <Input

            label="Password"

            name="plainPassword"

            value={
              form.plainPassword
            }

            onChange={handleChange}

          />



          <p className="
text-sm
text-gray-500
mt-2
">

            নতুন Password না দিলে আগের Password থাকবে।

          </p>


        </div>









        {/* SUBMIT */}


        <button

          type="button"

          disabled={saving}

          onClick={async () => {


            try {


              setSaving(true);



              const data =
                new FormData();



              Object.entries(form)
                .forEach(([key, value]) => {


                  data.append(
                    key,
                    value || ""
                  );


                });



              if (photo) {

                data.append(
                  "photo",
                  photo
                );

              }




              await api.put(

                `/students/${id}`,

                data,

                {

                  headers: {

                    "Content-Type":
                      "multipart/form-data",

                  }

                }

              );




              alert(
                "Student Updated Successfully"
              );



              navigate(
                `/students/${id}`
              );



            }

            catch (error) {

              console.log(error);

              alert(
                "Update Failed"
              );


            }

            finally {

              setSaving(false);

            }



          }}

          className="
bg-emerald-600
hover:bg-emerald-700
text-white
px-10
py-4
rounded-2xl
font-bold
shadow-lg
"

        >


          {

            saving

              ?

              "Updating..."

              :

              "Update Student"

          }


        </button>






      </form>


    </div>


  );


};


export default EditStudent;