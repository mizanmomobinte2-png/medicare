const express = require("express");

console.log("DOCTORS LOGIN ROUTE FILE LOADED");

const router = express.Router();

const pool = require("../db");

const bcrypt = require("bcrypt");

const {
  generateToken,
  verifyToken
} = require("../middleware/authMiddleware");

const authorize = require("../middleware/roleMiddleware");


// =========================================
// GET ALL DOCTORS
// ADMIN + PATIENT + DOCTOR
// (any logged-in user, since patients browse doctors to book)
// =========================================

router.get(
"/",
verifyToken,
async(req,res)=>{

try{


const result = await pool.query(`

SELECT

doc.doctor_id,
doc.name,
doc.email,
doc.phone,
doc.status,
doc.specialization,
doc.dept_id,
doc.visit_fee,
d.dept_name


FROM doctor doc


LEFT JOIN department d

ON doc.dept_id = d.dept_id


WHERE doc.status='active'


ORDER BY doc.doctor_id


`);



res.json(result.rows);



}catch(err){


console.error(
"Get doctors error:",
err
);


res.status(500).json({

error:err.message

});


}


});




// =========================================
// DOCTOR LOGIN
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

error:"Email and password are required"

});

}



const result = await pool.query(

`

SELECT *

FROM doctor

WHERE email=$1

`,

[email]

);



if(result.rows.length===0){

return res.status(401).json({

error:"Invalid email or password"

});

}



const doctor = result.rows[0];



if(!doctor.password){

return res.status(401).json({

error:"This doctor account has no password"

});

}




const matched = await bcrypt.compare(

password,

doctor.password

);




if(!matched){

return res.status(401).json({

error:"Invalid email or password"

});

}




const token = generateToken(

doctor.doctor_id,

"doctor"

);



res.json({

message:"Doctor login successful",

token,

role:"doctor",


doctor:{


doctor_id:doctor.doctor_id,

name:doctor.name,

email:doctor.email,

phone:doctor.phone,

status:doctor.status,

specialization:doctor.specialization,

dept_id:doctor.dept_id,

visit_fee:doctor.visit_fee


}


});



}catch(err){


console.error(
"Doctor login error:",
err
);


res.status(500).json({

error:err.message

});


}



});




// =========================================
// CREATE DOCTOR
// ADMIN ONLY
// =========================================

router.post(
"/",
verifyToken,
authorize("admin"),
async(req,res)=>{


const {

name,

email,

password,

salary,

phone,

specialization,

dept_id,

visit_fee

}=req.body;




try{


if(!name || !email || !password){

return res.status(400).json({

error:"Name, email and password are required"

});

}




const existing = await pool.query(

`

SELECT doctor_id

FROM doctor

WHERE email=$1

`,

[email]

);



if(existing.rows.length>0){

return res.status(409).json({

error:"Doctor already exists"

});

}




const hashedPassword = await bcrypt.hash(

password,

10

);



const result = await pool.query(

`

INSERT INTO doctor

(

name,

email,

password,

salary,

phone,

status,

specialization,

dept_id,

visit_fee

)


VALUES

($1,$2,$3,$4,$5,$6,$7,$8,$9)


RETURNING *

`,

[

name,

email,

hashedPassword,

salary || null,

phone || null,

"active",

specialization || null,

dept_id || null,

visit_fee === "" || visit_fee === undefined ? 0 : Number(visit_fee)

]


);




res.status(201).json({

message:"Doctor registered successfully",

doctor:result.rows[0]

});



}catch(err){


res.status(500).json({

error:err.message

});


}



});
// =========================================
// GET SINGLE DOCTOR
// ADMIN + SAME DOCTOR + PATIENT (to see fee before booking)
// =========================================

router.get(
"/:id",
verifyToken,
async(req,res)=>{


try{


const doctorId = Number(req.params.id);



if(
req.user.role==="doctor" &&
req.user.id !== doctorId
){

return res.status(403).json({

message:"You can access only your own profile"

});

}




const result = await pool.query(

`

SELECT

doc.*,

d.dept_name


FROM doctor doc


LEFT JOIN department d

ON doc.dept_id=d.dept_id


WHERE doc.doctor_id=$1


`,

[doctorId]

);



if(result.rows.length===0){

return res.status(404).json({

error:"Doctor not found"

});

}



const doctor = result.rows[0];

delete doctor.password;

res.json(doctor);



}catch(err){


console.error(

"Get doctor error:",

err

);


res.status(500).json({

error:err.message

});


}


});




// =========================================
// UPDATE DOCTOR
// ADMIN ONLY
// =========================================

router.put(
"/:id",
verifyToken,
authorize("admin"),
async(req,res)=>{


const {

name,

email,

salary,

phone,

status,

specialization,

dept_id,

visit_fee

}=req.body;



try{


const result = await pool.query(

`

UPDATE doctor

SET


name=COALESCE($1,name),

email=COALESCE($2,email),

salary=COALESCE($3,salary),

phone=COALESCE($4,phone),

status=COALESCE($5,status),

specialization=COALESCE($6,specialization),

dept_id=COALESCE($7,dept_id),

visit_fee=COALESCE($8,visit_fee)


WHERE doctor_id=$9


RETURNING *


`,

[

name,

email,

salary,

phone,

status,

specialization,

dept_id,

visit_fee === "" || visit_fee === undefined ? null : Number(visit_fee),

req.params.id

]


);




if(result.rows.length===0){

return res.status(404).json({

error:"Doctor not found"

});

}



res.json({

message:"Doctor updated successfully",

doctor:result.rows[0]

});



}catch(err){


res.status(500).json({

error:err.message

});


}



});




// =========================================
// DELETE DOCTOR
// ADMIN ONLY
// =========================================

router.delete(
"/:id",
verifyToken,
authorize("admin"),
async(req,res)=>{


try{


const result = await pool.query(

`

DELETE FROM doctor

WHERE doctor_id=$1


RETURNING doctor_id


`,

[

req.params.id

]


);



if(result.rows.length===0){

return res.status(404).json({

error:"Doctor not found"

});

}



res.json({

message:"Doctor deleted successfully"

});



}catch(err){


res.status(500).json({

error:err.message

});


}


});




// =========================================
// EXPORT
// =========================================

module.exports = router;