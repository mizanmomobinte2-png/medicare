const express = require("express");

const router = express.Router();

const pool = require("../db");

const bcrypt = require("bcrypt");

const {
  generateToken,
  verifyToken
} = require("../middleware/authMiddleware");

const authorize = require("../middleware/roleMiddleware");



// =========================================
// GET ALL PATIENTS
// ADMIN ONLY
// =========================================

router.get(
"/",
verifyToken,
authorize("admin"),
async(req,res)=>{


try{


const result =
await pool.query(

`
SELECT *

FROM patient

ORDER BY patient_id

`

);



res.json(result.rows);



}catch(err){


console.error(
"Get patients error:",
err
);


res.status(500).json({

error:err.message

});


}


});





// =========================================
// PATIENT LOGIN
// PUBLIC
// =========================================

router.post(
"/login",
async(req,res)=>{


const {

email,

password

}=req.body;



try{


if(!email || !password){


return res.status(400).json({

error:
"Email and password are required"

});


}




const result =
await pool.query(

`
SELECT *

FROM patient

WHERE email=$1

`,

[
email
]

);




if(result.rows.length===0){


return res.status(401).json({

error:
"Invalid email or password"

});


}




const patient =
result.rows[0];




if(!patient.password){


return res.status(401).json({

error:
"This patient account has no password"

});


}




const matched =
await bcrypt.compare(

password,

patient.password

);




if(!matched){


return res.status(401).json({

error:
"Invalid email or password"

});


}





const token =
generateToken(

patient.patient_id,

"patient"

);




res.status(200).json({


message:
"Patient login successful",


token,


role:"patient",


patient:{


patient_id:
patient.patient_id,


name:
patient.name,


email:
patient.email,


phone:
patient.phone,


dob:
patient.dob,


gender:
patient.gender,


blood_group:
patient.blood_group,


address:
patient.address


}


});




}catch(err){


console.error(
"Patient login error:",
err
);


res.status(500).json({

error:err.message

});


}



});





// =========================================
// CREATE PATIENT
// PUBLIC REGISTER
// =========================================

router.post(
"/",
async(req,res)=>{


const {

name,

email,

password,

phone,

dob,

gender,

blood_group,

address

}=req.body;



try{


if(!name || !email || !password){


return res.status(400).json({

error:
"Name, email and password are required"

});


}




const existingPatient =
await pool.query(

`
SELECT patient_id

FROM patient

WHERE email=$1

`,

[
email
]

);




if(existingPatient.rows.length>0){


return res.status(409).json({

error:
"Patient with this email already exists"

});


}




const hashedPassword =
await bcrypt.hash(

password,

10

);




const result =
await pool.query(

`

INSERT INTO patient

(

name,

email,

password,

phone,

dob,

gender,

blood_group,

address

)


VALUES

($1,$2,$3,$4,$5,$6,$7,$8)



RETURNING

patient_id,

name,

email,

phone,

dob,

gender,

blood_group,

address


`,

[

name,

email,

hashedPassword,

phone || null,

dob || null,

gender || null,

blood_group || null,

address || null

]


);




res.status(201).json({

message:
"Patient registered successfully",

patient:
result.rows[0]

});




}catch(err){


console.error(
"Patient registration error:",
err
);


res.status(500).json({

error:err.message

});


}



});





// =========================================
// GET SINGLE PATIENT
// ADMIN + OWN PATIENT
// =========================================

router.get(
"/:id",
verifyToken,
async(req,res)=>{


try{


const patientId =
Number(req.params.id);



if(

req.user.role==="patient" &&

req.user.id !== patientId

){


return res.status(403).json({

message:
"You can access only your own profile"

});


}




if(

req.user.role!=="admin" &&

req.user.role!=="patient"

){


return res.status(403).json({

message:
"Access forbidden"

});


}





const result =
await pool.query(

`

SELECT *

FROM patient

WHERE patient_id=$1


`,

[
patientId
]

);




if(result.rows.length===0){


return res.status(404).json({

error:
"Patient not found"

});


}




res.json(result.rows[0]);



}catch(err){


res.status(500).json({

error:err.message

});


}



});





// =========================================
// UPDATE PATIENT
// ADMIN + OWN PATIENT
// =========================================

router.put(
"/:id",
verifyToken,
async(req,res)=>{


const patientId =
Number(req.params.id);



if(

req.user.role==="patient" &&

req.user.id !== patientId

){


return res.status(403).json({

message:
"You can update only your own profile"

});


}




if(

req.user.role!=="admin" &&

req.user.role!=="patient"

){


return res.status(403).json({

message:
"Access forbidden"

});


}





const {

name,

email,

password,

phone,

dob,

gender,

blood_group,

address

}=req.body;



try{


let hashedPassword=null;



if(password){


hashedPassword =
await bcrypt.hash(

password,

10

);

}




const result =
await pool.query(

`

UPDATE patient


SET


name=COALESCE($1,name),


email=COALESCE($2,email),


password=COALESCE($3,password),


phone=COALESCE($4,phone),


dob=COALESCE($5,dob),


gender=COALESCE($6,gender),


blood_group=COALESCE($7,blood_group),


address=COALESCE($8,address)



WHERE patient_id=$9



RETURNING

patient_id,

name,

email,

phone,

dob,

gender,

blood_group,

address


`,

[

name,

email,

hashedPassword,

phone,

dob,

gender,

blood_group,

address,

patientId

]

);




if(result.rows.length===0){


return res.status(404).json({

error:
"Patient not found"

});


}




res.json({

message:
"Patient updated successfully",

patient:
result.rows[0]

});




}catch(err){


res.status(500).json({

error:err.message

});


}



});





// =========================================
// DELETE PATIENT
// ADMIN ONLY
// =========================================

router.delete(
"/:id",
verifyToken,
authorize("admin"),
async(req,res)=>{


try{


const result =
await pool.query(

`

DELETE FROM patient

WHERE patient_id=$1


RETURNING patient_id


`,

[
req.params.id
]

);




if(result.rows.length===0){


return res.status(404).json({

error:
"Patient not found"

});


}




res.json({

message:
"Patient deleted successfully"

});




}catch(err){


res.status(500).json({

error:err.message

});


}



});





module.exports = router;