const express = require("express");

console.log("STAFF ROUTE FILE LOADED");

const router = express.Router();

const pool = require("../db");

const bcrypt = require("bcrypt");

const {
  generateToken,
  verifyToken
} = require("../middleware/authMiddleware");

const authorize = require("../middleware/roleMiddleware");



// =========================================
// GET ALL STAFF
// ADMIN ONLY
// =========================================

router.get(
"/",
verifyToken,
authorize("admin"),
async(req,res)=>{

try{


const result = await pool.query(`

SELECT
s.*,
d.dept_name

FROM staff s

LEFT JOIN department d

ON s.dept_id = d.dept_id

ORDER BY s.staff_id

`);


res.json(result.rows);



}catch(err){

console.error(
"Get staff error:",
err
);


res.status(500).json({
error:err.message
});


}

});





// =========================================
// STAFF LOGIN
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



const result = await pool.query(
`

SELECT *

FROM staff

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



const staff = result.rows[0];



if(!staff.password){

return res.status(401).json({

error:
"This staff account has no password"

});

}




const matched = await bcrypt.compare(
password,
staff.password
);



if(!matched){

return res.status(401).json({

error:
"Invalid email or password"

});

}




const token = generateToken(
staff.staff_id,
"staff"
);



res.status(200).json({

message:
"Staff login successful",

token,

role:"staff",


staff:{


staff_id:
staff.staff_id,


name:
staff.name,


email:
staff.email,


phone:
staff.phone,


salary:
staff.salary,


dept_id:
staff.dept_id,


status:
staff.status


}


});



}catch(err){


console.error(
"Staff login error:",
err
);


res.status(500).json({

error:err.message

});


}


});







// =========================================
// CREATE STAFF
// PUBLIC REGISTER
// =========================================


router.post(
"/",
async(req,res)=>{


const {

name,

email,

password,

salary,

phone,

dept_id

}=req.body;



try{


if(!name || !email || !password){

return res.status(400).json({

error:
"Name, email and password are required"

});

}



const existingStaff = await pool.query(
`

SELECT staff_id

FROM staff

WHERE email=$1

`,
[
email
]
);



if(existingStaff.rows.length>0){

return res.status(409).json({

error:
"Staff with this email already exists"

});

}




const hashedPassword = await bcrypt.hash(
password,
10
);




const result = await pool.query(
`

INSERT INTO staff

(

name,

email,

password,

salary,

phone,

status,

dept_id

)


VALUES

($1,$2,$3,$4,$5,$6,$7)


RETURNING

staff_id,

name,

email,

salary,

phone,

status,

dept_id


`,
[

name,

email,

hashedPassword,

salary || null,

phone || null,

"active",

dept_id || null

]

);





res.status(201).json({

message:
"Staff registered successfully",

staff:
result.rows[0]

});




}catch(err){


console.error(
"Staff registration error:",
err
);


res.status(500).json({

error:err.message

});


}



});








// =========================================
// GET SINGLE STAFF
// ADMIN + OWN STAFF
// =========================================


router.get(
"/:id",
verifyToken,
async(req,res)=>{


try{


const staffId = Number(req.params.id);



if(
req.user.role==="staff" &&
req.user.id !== staffId
){

return res.status(403).json({

message:
"You can access only your own profile"

});

}




if(
req.user.role!=="admin" &&
req.user.role!=="staff"
){

return res.status(403).json({

message:
"Access forbidden"

});

}





const result = await pool.query(
`

SELECT

s.*,

d.dept_name


FROM staff s


LEFT JOIN department d

ON s.dept_id=d.dept_id


WHERE s.staff_id=$1


`,
[
staffId
]

);



if(result.rows.length===0){

return res.status(404).json({

error:
"Staff not found"

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
// UPDATE STAFF
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

dept_id

}=req.body;



try{


const result = await pool.query(
`

UPDATE staff

SET


name=COALESCE($1,name),


email=COALESCE($2,email),


salary=COALESCE($3,salary),


phone=COALESCE($4,phone),


status=COALESCE($5,status),


dept_id=COALESCE($6,dept_id)



WHERE staff_id=$7



RETURNING *


`,
[

name,

email,

salary,

phone,

status,

dept_id,

req.params.id

]

);





if(result.rows.length===0){

return res.status(404).json({

error:
"Staff not found"

});

}



res.json({

message:
"Staff updated successfully",

staff:
result.rows[0]

});




}catch(err){


res.status(500).json({

error:err.message

});


}


});







// =========================================
// DELETE STAFF
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

DELETE FROM staff

WHERE staff_id=$1


RETURNING staff_id


`,
[
req.params.id
]

);




if(result.rows.length===0){

return res.status(404).json({

error:
"Staff not found"

});

}



res.json({

message:
"Staff deleted successfully"

});




}catch(err){


res.status(500).json({

error:err.message

});


}


});






module.exports = router;