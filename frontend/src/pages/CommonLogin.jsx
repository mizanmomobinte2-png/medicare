import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";


const API = "http://localhost:5000/api";


function CommonLogin() {


  const navigate = useNavigate();


  const [role, setRole] = useState("patient");


  const [formData, setFormData] = useState({

    username: "",
    email: "",
    password: ""

  });



  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);





  const handleChange = (event) => {


    const {
      name,
      value
    } = event.target;



    setFormData((previous) => ({

      ...previous,

      [name]: value

    }));


  };







  const getUrl = () => {


    switch (role) {


      case "admin":

        return `${API}/admin/login`;



      case "doctor":

        return `${API}/doctors/login`;



      case "staff":

        return `${API}/staff/login`;



      case "patient":

      default:

        return `${API}/patients/login`;


    }


  };







  const getBody = () => {


    if (role === "admin") {


      return {

        username:
        formData.username,

        password:
        formData.password

      };


    }




    return {


      email:
      formData.email,


      password:
      formData.password


    };


  };








  const extractUser = (data) => {


    if (!data) {

      return null;

    }



    if (
      data[role] &&
      typeof data[role] === "object"
    ) {

      return data[role];

    }




    if (
      data.user &&
      typeof data.user === "object"
    ) {

      return data.user;

    }





    if (
      data.data &&
      typeof data.data === "object"
    ) {

      return data.data;

    }





    return data;


  };








  const getRequiredId = (user) => {


    if (!user) {

      return null;

    }



    switch (role) {


      case "admin":

        return user.admin_id;



      case "doctor":

        return user.doctor_id;



      case "staff":

        return user.staff_id;



      case "patient":

      default:

        return user.patient_id;


    }


  };









  const goDashboard = () => {


    switch (role) {


      case "admin":


        navigate(
          "/admin-dashboard",
          {
            replace: true
          }
        );

        break;




      case "doctor":


        navigate(
          "/doctor-dashboard",
          {
            replace: true
          }
        );

        break;





      case "staff":


        navigate(
          "/staff-dashboard",
          {
            replace: true
          }
        );

        break;





      case "patient":

      default:


        navigate(
          "/patient-dashboard",
          {
            replace: true
          }
        );

        break;


    }


  };









  const handleSubmit = async (event) => {


    event.preventDefault();


    setMessage("");

    setLoading(true);





    try {


      const response =
      await fetch(
        getUrl(),
        {

          method: "POST",

          headers: {

            "Content-Type":
            "application/json"

          },


          body:
          JSON.stringify(
            getBody()
          )


        }
      );







      const data =
      await response.json();






      console.log(
        "LOGIN RESPONSE:",
        data
      );






      if (!response.ok) {


        setMessage(

          data.error ||
          data.message ||
          "Login failed"

        );


        return;


      }







      const user =
      extractUser(data);







      const requiredId =
      getRequiredId(user);








      if (!requiredId) {


        setMessage(

          `${role} login succeeded but ID was not found`

        );


        return;


      }








      // =============================
      // CLEAR OLD SESSION
      // =============================


      localStorage.removeItem("admin");

      localStorage.removeItem("doctor");

      localStorage.removeItem("staff");

      localStorage.removeItem("patient");

      localStorage.removeItem("role");

      localStorage.removeItem("token");








      // =============================
      // SAVE TOKEN
      // =============================


      if (data.token) {


        localStorage.setItem(
          "token",
          data.token
        );


      }








      // =============================
      // SAVE USER
      // =============================


      localStorage.setItem(

        role,

        JSON.stringify(user)

      );





      localStorage.setItem(

        "role",

        role

      );








      console.log(
        "SAVED TOKEN:",
        localStorage.getItem("token")
      );






      console.log(
        "SAVED USER:",
        user
      );






      goDashboard();






    } catch (error) {


      console.error(
        "LOGIN ERROR:",
        error
      );



      setMessage(
        "Cannot connect to MediCare server."
      );



    } finally {


      setLoading(false);


    }



  };









  return (


    <div

      style={{

        minHeight: "100vh",

        background: "#f5f5f5"

      }}

    >



      <div

        style={{

          background: "#ffffff",

          padding: "20px 30px",

          borderBottom: "1px solid #ddd",

          fontSize: "25px",

          fontWeight: "bold"

        }}

      >

        MediCare

      </div>







      <div

        style={{

          width: "420px",

          maxWidth: "90%",

          margin: "70px auto",

          padding: "30px",

          background: "#ffffff",

          border: "1px solid #cccccc"

        }}

      >



        <h1

          style={{

            textAlign: "center"

          }}

        >

          Login

        </h1>







        {message && (

          <div

            style={{

              padding: "10px",

              border: "1px solid #ccc",

              marginBottom: "15px"

            }}

          >

            {message}

          </div>

        )}







        <form onSubmit={handleSubmit}>


          <label>

            Login As

          </label>




          <select

            value={role}

            onChange={(event)=>{

              setRole(event.target.value);

              setMessage("");

            }}

            style={{

              width:"100%",

              padding:"10px",

              margin:"6px 0 18px"

            }}

          >


            <option value="admin">

              Admin

            </option>



            <option value="doctor">

              Doctor

            </option>



            <option value="staff">

              Staff

            </option>



            <option value="patient">

              Patient

            </option>



          </select>







          {
          role === "admin" ?

          <>

          <label>

          Username

          </label>


          <input

          type="text"

          name="username"

          value={formData.username}

          onChange={handleChange}

          required

          style={{

          width:"100%",

          padding:"10px",

          margin:"6px 0 18px"

          }}

          />


          </>


          :


          <>

          <label>

          Email

          </label>


          <input

          type="email"

          name="email"

          value={formData.email}

          onChange={handleChange}

          required

          style={{

          width:"100%",

          padding:"10px",

          margin:"6px 0 18px"

          }}

          />


          </>

          }







          <label>

            Password

          </label>



          <input

            type="password"

            name="password"

            value={formData.password}

            onChange={handleChange}

            required

            style={{

              width:"100%",

              padding:"10px",

              margin:"6px 0 18px"

            }}

          />








          <button

            type="submit"

            disabled={loading}

            style={{

              width:"100%",

              padding:"11px",

              cursor:"pointer"

            }}

          >


          {

          loading ?

          "Logging in..." :

          "Login"

          }


          </button>



        </form>







        <p

          style={{

            textAlign:"center",

            marginTop:"18px"

          }}

        >

          Don't have an account?{" "}

          <Link to="/register">

            Register

          </Link>


        </p>





      </div>



    </div>


  );


}


export default CommonLogin;