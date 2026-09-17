function logout(){

  localStorage.removeItem("token");

  localStorage.removeItem("role");

  localStorage.removeItem("admin");

  localStorage.removeItem("doctor");

  localStorage.removeItem("staff");

  localStorage.removeItem("patient");


  window.location.href="/login";

}


export default logout;