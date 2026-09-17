const express = require("express");
const router = express.Router();
const pool = require("../db");

console.log("LAB TEST ROUTE FILE LOADED");


// =========================================
// GET ALL LAB TESTS
// =========================================

router.get("/", async (req, res) => {

  try {

    const result = await pool.query(`

      SELECT

        lt.*,

        p.name AS patient_name,

        d.name AS doctor_name,

        s.name AS staff_name


      FROM labtest lt


      LEFT JOIN patient p
      ON lt.patient_id = p.patient_id


      LEFT JOIN doctor d
      ON lt.doctor_id = d.doctor_id


      LEFT JOIN staff s
      ON lt.staff_id = s.staff_id


      ORDER BY lt.test_id DESC

    `);


    res.json(result.rows);


  } catch(err){

    console.error(
      "Get lab tests error:",
      err
    );


    res.status(500).json({
      error:err.message
    });

  }

});





// =========================================
// STAFF LAB TEST REQUESTS
// =========================================

router.get(
"/requests/all",
async(req,res)=>{


try{


const result = await pool.query(`


SELECT


lt.*,


p.name AS patient_name,


p.phone AS patient_phone,


d.name AS doctor_name,


s.name AS staff_name



FROM labtest lt



LEFT JOIN patient p

ON lt.patient_id=p.patient_id



LEFT JOIN doctor d

ON lt.doctor_id=d.doctor_id



LEFT JOIN staff s

ON lt.staff_id=s.staff_id



WHERE lt.status IN

(
'requested',
'scheduled'
)



ORDER BY lt.test_id DESC



`);



res.json(result.rows);



}catch(err){


console.error(
"Lab request error:",
err
);



res.status(500).json({

error:err.message

});


}


});






// =========================================
// GET DOCTOR LAB TESTS
// =========================================


router.get(
"/doctor/:doctorId",
async(req,res)=>{


try{


const result =
await pool.query(`


SELECT


lt.*,


p.name AS patient_name,


p.phone,


p.gender,


p.blood_group,


s.name AS staff_name



FROM labtest lt



LEFT JOIN patient p

ON lt.patient_id=p.patient_id



LEFT JOIN staff s

ON lt.staff_id=s.staff_id



WHERE lt.doctor_id=$1



ORDER BY lt.test_id DESC



`,
[
req.params.doctorId
]);



res.json(result.rows);



}catch(err){


res.status(500).json({

error:err.message

});


}


});






// =========================================
// GET PATIENT LAB TESTS
// =========================================


router.get(
"/patient/:patientId",
async(req,res)=>{


try{


const result =
await pool.query(`


SELECT


lt.*,


d.name AS doctor_name,


s.name AS staff_name



FROM labtest lt



LEFT JOIN doctor d

ON lt.doctor_id=d.doctor_id



LEFT JOIN staff s

ON lt.staff_id=s.staff_id



WHERE lt.patient_id=$1



ORDER BY lt.test_id DESC



`,
[
req.params.patientId
]);



res.json(result.rows);



}catch(err){


res.status(500).json({

error:err.message

});


}


});






// =========================================
// DOCTOR ORDER LAB TEST
// =========================================


router.post(
"/doctor/order",
async(req,res)=>{


const {

patient_id,

doctor_id,

test_name,

type

}=req.body;



try{


if(
!patient_id ||
!doctor_id ||
!test_name
){

return res.status(400).json({

error:
"Patient, doctor and test name are required"

});

}



const result =
await pool.query(`


INSERT INTO labtest

(

patient_id,

doctor_id,

staff_id,

test_name,

type,

unit_price,

result,

date,

status

)



VALUES

(

$1,

$2,

NULL,

$3,

$4,

NULL,

NULL,

NULL,

'requested'

)



RETURNING *



`,
[

patient_id,

doctor_id,

test_name,

type || null

]);




res.status(201).json({

message:
"Lab test ordered successfully",

lab_test:
result.rows[0]

});



}catch(err){


console.error(
"Doctor order lab error:",
err
);



res.status(500).json({

error:err.message

});


}


});
// =========================================
// STAFF SCHEDULE LAB TEST
// =========================================


router.patch(
"/:id/staff-schedule",
async(req,res)=>{


const {

staff_id,

date,

unit_price

}=req.body;



try{


if(!staff_id){

return res.status(400).json({

error:"staff_id is required"

});

}



if(!date){

return res.status(400).json({

error:"date is required"

});

}




const staffCheck =
await pool.query(

`
SELECT staff_id
FROM staff
WHERE staff_id=$1
`,
[
staff_id
]

);



if(staffCheck.rows.length===0){

return res.status(404).json({

error:"Staff not found"

});

}




const result =
await pool.query(

`

UPDATE labtest

SET

staff_id=$1,

date=$2,

unit_price=
COALESCE($3,unit_price),

status='scheduled'


WHERE test_id=$4


AND status IN

(
'requested',
'scheduled'
)


RETURNING *

`,

[

staff_id,

date,

unit_price || null,

req.params.id

]

);




if(result.rows.length===0){

return res.status(404).json({

error:
"Lab test request not found"

});

}



res.json({

message:
"Lab test scheduled successfully",

lab_test:
result.rows[0]

});



}catch(err){


console.error(
"Staff schedule error:",
err
);


res.status(500).json({

error:err.message

});


}


});






// =========================================
// DOCTOR COMPLETE LAB TEST
// =========================================


router.patch(
"/:id/doctor-complete",
async(req,res)=>{


const {

doctor_id,

result

}=req.body;



try{


if(!doctor_id || !result){

return res.status(400).json({

error:
"doctor_id and result are required"

});

}




const update =
await pool.query(

`

UPDATE labtest


SET


result=$1,

status='completed'


WHERE

test_id=$2

AND doctor_id=$3


RETURNING *


`,

[

result,

req.params.id,

doctor_id

]

);




if(update.rows.length===0){

return res.status(404).json({

error:
"Lab test not found"

});

}




res.json({

message:
"Lab test completed successfully",

lab_test:
update.rows[0]

});



}catch(err){


res.status(500).json({

error:err.message

});


}


});








// =========================================
// GET SINGLE LAB TEST
// =========================================


router.get(
"/:id",
async(req,res)=>{


try{


const result =
await pool.query(

`

SELECT


lt.*,


p.name AS patient_name,


d.name AS doctor_name,


s.name AS staff_name



FROM labtest lt



LEFT JOIN patient p

ON lt.patient_id=p.patient_id



LEFT JOIN doctor d

ON lt.doctor_id=d.doctor_id



LEFT JOIN staff s

ON lt.staff_id=s.staff_id



WHERE lt.test_id=$1



`,

[
req.params.id
]

);



if(result.rows.length===0){

return res.status(404).json({

error:"Lab test not found"

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
// NORMAL CREATE
// =========================================


router.post(
"/",
async(req,res)=>{


const {

patient_id,

doctor_id,

staff_id,

test_name,

type,

unit_price,

result,

date,

status

}=req.body;



try{


const dbResult =
await pool.query(

`

INSERT INTO labtest

(

patient_id,

doctor_id,

staff_id,

test_name,

type,

unit_price,

result,

date,

status

)


VALUES

($1,$2,$3,$4,$5,$6,$7,$8,$9)


RETURNING *

`,

[

patient_id,

doctor_id || null,

staff_id || null,

test_name,

type || null,

unit_price || null,

result || null,

date || null,

status || "requested"

]

);



res.status(201).json(

dbResult.rows[0]

);



}catch(err){


res.status(500).json({

error:err.message

});


}


});







// =========================================
// UPDATE LAB TEST
// =========================================


router.put(
"/:id",
async(req,res)=>{


const {

patient_id,

doctor_id,

staff_id,

test_name,

type,

unit_price,

result,

date,

status

}=req.body;



try{


const dbResult =
await pool.query(

`

UPDATE labtest

SET


patient_id=
COALESCE($1,patient_id),


doctor_id=
COALESCE($2,doctor_id),


staff_id=
COALESCE($3,staff_id),


test_name=
COALESCE($4,test_name),


type=
COALESCE($5,type),


unit_price=
COALESCE($6,unit_price),


result=
COALESCE($7,result),


date=
COALESCE($8,date),


status=
COALESCE($9,status)


WHERE test_id=$10


RETURNING *

`,

[

patient_id,

doctor_id,

staff_id,

test_name,

type,

unit_price,

result,

date,

status,

req.params.id

]

);




if(dbResult.rows.length===0){

return res.status(404).json({

error:"Lab test not found"

});

}



res.json(

dbResult.rows[0]

);



}catch(err){


res.status(500).json({

error:err.message

});


}


});







// =========================================
// DELETE LAB TEST
// =========================================


router.delete(
"/:id",
async(req,res)=>{


try{


const result =
await pool.query(

`

DELETE FROM labtest

WHERE test_id=$1

RETURNING test_id

`,

[
req.params.id
]

);



if(result.rows.length===0){

return res.status(404).json({

error:"Lab test not found"

});

}



res.json({

message:
"Lab test deleted"

});



}catch(err){


res.status(500).json({

error:err.message

});


}


});





module.exports = router;