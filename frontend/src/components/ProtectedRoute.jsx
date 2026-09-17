import { Navigate } from "react-router-dom";


function ProtectedRoute({
  children,
  allowedRole
}) {


  const token =
    localStorage.getItem("token");


  const role =
    localStorage.getItem("role");



  // ============================
  // No Login
  // ============================

  if(!token){

    return (

      <Navigate
        to="/login"
        replace
      />

    );

  }




  // ============================
  // Wrong Role
  // ============================

  if(
    allowedRole &&
    role !== allowedRole
  ){

    return (

      <Navigate
        to="/login"
        replace
      />

    );

  }





  return children;


}


export default ProtectedRoute;