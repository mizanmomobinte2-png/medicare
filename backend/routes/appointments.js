const express = require("express");
const router = express.Router();
const pool = require("../db");


// =====================================
// GET ALL APPOINTMENTS
// =====================================

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        a.*,

        p.name AS patient_name,
        p.email AS patient_email,
        p.phone AS patient_phone,

        d.name AS doctor_name,

        s.name AS staff_name

      FROM appointment a

      LEFT JOIN patient p
        ON a.patient_id = p.patient_id

      LEFT JOIN doctor d
        ON a.doctor_id = d.doctor_id

      LEFT JOIN staff s
        ON a.staff_id = s.staff_id

      ORDER BY
        a.appt_date DESC,
        a.appt_time
    `);

    res.json(result.rows);

  } catch(err){

    console.error(
      "Get appointments error:",
      err
    );

    res.status(500).json({
      error:err.message
    });

  }
});



// =====================================
// GET APPOINTMENTS OF ONE DOCTOR
// =====================================

router.get(
"/doctor/:doctorId",
async(req,res)=>{

try{

const result = await pool.query(
`
SELECT

a.appt_id,
a.patient_id,
a.doctor_id,
a.staff_id,
a.appt_date,
a.appt_time,
a.status,
a.reason,
a.notes,


p.name AS patient_name,
p.email AS patient_email,
p.phone AS patient_phone,
p.gender,
p.blood_group,


s.name AS staff_name


FROM appointment a


LEFT JOIN patient p
ON a.patient_id=p.patient_id


LEFT JOIN staff s
ON a.staff_id=s.staff_id


WHERE a.doctor_id=$1


ORDER BY
a.appt_date DESC,
a.appt_time

`,
[req.params.doctorId]
);


res.json(result.rows);


}catch(err){

console.error(
"Doctor appointments error:",
err
);


res.status(500).json({
error:err.message
});


}

});




// =====================================
// GET TODAY DOCTOR APPOINTMENTS
// =====================================

router.get(
"/doctor/:doctorId/today",
async(req,res)=>{

try{

const result =
await pool.query(
`
SELECT

a.appt_id,
a.patient_id,
a.appt_date,
a.appt_time,
a.status,
a.reason,
a.notes,


p.name AS patient_name,
p.phone AS patient_phone


FROM appointment a


LEFT JOIN patient p
ON a.patient_id=p.patient_id


WHERE
a.doctor_id=$1

AND a.appt_date=CURRENT_DATE


ORDER BY a.appt_time

`,
[req.params.doctorId]
);


res.json(result.rows);


}catch(err){

console.error(
"Today's doctor appointments error:",
err
);


res.status(500).json({
error:err.message
});


}

});



// =====================================
// DOCTOR SUMMARY
// =====================================

router.get(
"/doctor/:doctorId/summary",
async(req,res)=>{

try{

const result =
await pool.query(
`
SELECT


COUNT(*) FILTER(
WHERE appt_date=CURRENT_DATE
)
AS today_appointments,


COUNT(*) FILTER(
WHERE appt_date>CURRENT_DATE
)
AS upcoming_appointments,


COUNT(*) FILTER(
WHERE status='pending'
)
AS pending_appointments,


COUNT(*) FILTER(
WHERE status='completed'
)
AS completed_appointments


FROM appointment


WHERE doctor_id=$1

`,
[req.params.doctorId]
);


res.json(result.rows[0]);


}catch(err){

res.status(500).json({
error:err.message
});

}

});



// =====================================
// GET DOCTOR PATIENTS
// =====================================

router.get(
"/doctor/:doctorId/patients",
async(req,res)=>{

try{

const result =
await pool.query(
`
SELECT DISTINCT

p.patient_id,
p.name,
p.email,
p.phone,
p.dob,
p.gender,
p.blood_group,
p.address


FROM patient p


JOIN appointment a

ON p.patient_id=a.patient_id


WHERE a.doctor_id=$1


ORDER BY p.name

`,
[req.params.doctorId]
);


res.json(result.rows);


}catch(err){

res.status(500).json({
error:err.message
});

}

});



// =====================================
// GET STAFF APPOINTMENTS
// =====================================

router.get(
"/staff/:staffId",
async(req,res)=>{

try{

const result =
await pool.query(
`
SELECT


a.appt_id,
a.patient_id,
a.doctor_id,
a.staff_id,
a.appt_date,
a.appt_time,
a.status,
a.reason,
a.notes,


p.name AS patient_name,
p.email AS patient_email,
p.phone AS patient_phone,


d.name AS doctor_name


FROM appointment a


LEFT JOIN patient p
ON a.patient_id=p.patient_id


LEFT JOIN doctor d
ON a.doctor_id=d.doctor_id


WHERE a.staff_id=$1


ORDER BY
a.appt_date DESC,
a.appt_time

`,
[req.params.staffId]
);


res.json(result.rows);


}catch(err){

console.error(
"Staff appointments error:",
err
);


res.status(500).json({
error:err.message
});


}

});
// =====================================
// GET STAFF SUMMARY
// =====================================

router.get(
"/staff/:staffId/summary",
async(req,res)=>{

try{

const result =
await pool.query(
`
SELECT

COUNT(*) AS total_appointments,


COUNT(*) FILTER(
WHERE status='pending'
)
AS pending_appointments,


COUNT(*) FILTER(
WHERE appt_date>=CURRENT_DATE

AND status NOT IN(
'completed',
'cancelled',
'rejected'
)

)
AS upcoming_appointments


FROM appointment


WHERE staff_id=$1

`,
[req.params.staffId]
);


res.json(result.rows[0]);


}catch(err){

console.error(
"Staff appointment summary error:",
err
);


res.status(500).json({
error:err.message
});

}

});




// =====================================
// GET UNASSIGNED APPOINTMENTS
// =====================================

router.get(
"/unassigned/all",
async(req,res)=>{

try{

const result =
await pool.query(
`
SELECT


a.appt_id,
a.patient_id,
a.doctor_id,
a.staff_id,
a.appt_date,
a.appt_time,
a.status,
a.reason,
a.notes,


p.name AS patient_name,
p.email AS patient_email,
p.phone AS patient_phone,


d.name AS doctor_name


FROM appointment a


LEFT JOIN patient p
ON a.patient_id=p.patient_id


LEFT JOIN doctor d
ON a.doctor_id=d.doctor_id


WHERE a.staff_id IS NULL


ORDER BY
a.appt_date,
a.appt_time

`
);


res.json(result.rows);


}catch(err){

console.error(
"Unassigned appointments error:",
err
);


res.status(500).json({
error:err.message
});

}

});




// =====================================
// GET SINGLE APPOINTMENT
// =====================================

router.get(
"/:id",
async(req,res)=>{

try{

const result =
await pool.query(
`
SELECT

a.*,


p.name AS patient_name,

p.email AS patient_email,

p.phone AS patient_phone,


d.name AS doctor_name,


s.name AS staff_name


FROM appointment a


LEFT JOIN patient p
ON a.patient_id=p.patient_id


LEFT JOIN doctor d
ON a.doctor_id=d.doctor_id


LEFT JOIN staff s
ON a.staff_id=s.staff_id


WHERE a.appt_id=$1

`,
[req.params.id]
);



if(result.rows.length===0){

return res.status(404).json({
error:"Appointment not found"
});

}


res.json(result.rows[0]);


}catch(err){

res.status(500).json({
error:err.message
});

}

});




// =====================================
// CREATE APPOINTMENT
// =====================================

router.post(
"/",
async(req,res)=>{


const {

patient_id,

doctor_id,

staff_id,

appt_date,

appt_time,

status,

reason,

notes


}=req.body;



try{


const result =
await pool.query(
`

INSERT INTO appointment

(

patient_id,

doctor_id,

staff_id,

appt_date,

appt_time,

status,

reason,

notes

)


VALUES

($1,$2,$3,$4,$5,$6,$7,$8)


RETURNING *

`,
[

patient_id,

doctor_id || null,

staff_id || null,

appt_date,

appt_time,

status || "pending",

reason || null,

notes || null

]

);



res.status(201).json({

message:
"Appointment created successfully",

appointment:
result.rows[0]

});


}catch(err){

console.error(
"Create appointment error:",
err
);


res.status(500).json({
error:err.message
});


}

});




// =====================================
// UPDATE APPOINTMENT
// =====================================

router.put(
"/:id",
async(req,res)=>{


const {

patient_id,

doctor_id,

staff_id,

appt_date,

appt_time,

status,

reason,

notes

}=req.body;



try{


const result =
await pool.query(
`

UPDATE appointment


SET


patient_id=
COALESCE($1,patient_id),


doctor_id=
COALESCE($2,doctor_id),


staff_id=
COALESCE($3,staff_id),


appt_date=
COALESCE($4,appt_date),


appt_time=
COALESCE($5,appt_time),


status=
COALESCE($6,status),


reason=
COALESCE($7,reason),


notes=
COALESCE($8,notes)


WHERE appt_id=$9


RETURNING *

`,
[

patient_id,

doctor_id,

staff_id,

appt_date,

appt_time,

status,

reason,

notes,

req.params.id

]

);



if(result.rows.length===0){

return res.status(404).json({
error:"Appointment not found"
});

}



res.json({

message:
"Appointment updated successfully",

appointment:
result.rows[0]

});


}catch(err){

res.status(500).json({
error:err.message
});

}

});




// =====================================
// DOCTOR UPDATE STATUS + NOTES
// =====================================

router.patch(
"/:id/doctor-update",
async(req,res)=>{


const {

status,

notes

}=req.body;



try{


const result =
await pool.query(
`

UPDATE appointment


SET


status=
COALESCE($1,status),


notes=
COALESCE($2,notes)


WHERE appt_id=$3


RETURNING *

`,
[

status,

notes,

req.params.id

]

);



if(result.rows.length===0){

return res.status(404).json({
error:"Appointment not found"
});

}


res.json({

message:
"Appointment updated successfully",

appointment:
result.rows[0]

});


}catch(err){

res.status(500).json({
error:err.message
});

}

});




// =====================================
// STAFF ASSIGN / UPDATE APPOINTMENT
// =====================================

router.patch(
"/:id/staff-update",
async(req,res)=>{


const {

staff_id,

appt_date,

appt_time,

notes

}=req.body;



try{


if(!staff_id){

return res.status(400).json({

error:"staff_id is required"

});

}



const result =
await pool.query(
`

UPDATE appointment


SET


staff_id=
COALESCE($1,staff_id),


appt_date=
COALESCE($2,appt_date),


appt_time=
COALESCE($3,appt_time),


notes=
COALESCE($4,notes)


WHERE appt_id=$5


RETURNING *

`,
[

staff_id,

appt_date,

appt_time,

notes,

req.params.id

]

);



if(result.rows.length===0){

return res.status(404).json({

error:"Appointment not found"

});

}



res.json({

message:
"Appointment schedule updated successfully",

appointment:
result.rows[0]

});


}catch(err){

console.error(
"Staff update error:",
err
);


res.status(500).json({
error:err.message
});

}

});




// =====================================
// DELETE APPOINTMENT
// =====================================

router.delete(
"/:id",
async(req,res)=>{


try{


const result =
await pool.query(
`

DELETE FROM appointment


WHERE appt_id=$1


RETURNING appt_id

`,
[req.params.id]
);



if(result.rows.length===0){

return res.status(404).json({

error:"Appointment not found"

});

}



res.json({

message:
"Appointment deleted"

});


}catch(err){

res.status(500).json({

error:err.message

});

}

});



module.exports = router;