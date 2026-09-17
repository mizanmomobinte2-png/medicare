const API_BASE = "/api";


function getToken() {
  return localStorage.getItem("token");
}



async function request(url, options = {}) {


  const token = getToken();



  const headers = {

    "Content-Type": "application/json",

  };



  if(token){

    headers.Authorization =
      `Bearer ${token}`;

  }



  const response = await fetch(
    `${API_BASE}${url}`,
    {
      ...options,
      headers:{
        ...headers,
        ...(options.headers || {})
      }
    }
  );



  const data =
    await response.json();



  if(!response.ok){


    throw new Error(
      data.error ||
      data.message ||
      "Something went wrong"
    );


  }



  return data;

}



export const api = {


  get:(url)=>
    request(url),



  post:(url,body)=>
    request(
      url,
      {
        method:"POST",
        body:JSON.stringify(body)
      }
    ),



  put:(url,body)=>
    request(
      url,
      {
        method:"PUT",
        body:JSON.stringify(body)
      }
    ),



  delete:(url)=>
    request(
      url,
      {
        method:"DELETE"
      }
    ),



};



export default api;