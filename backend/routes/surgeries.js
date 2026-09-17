const express = require("express");
const router = express.Router();
const pool = require("../db");


// =========================================
// GET ALL SURGERIES
// =========================================

router.get("/", async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT
        s.*,

        p.name AS patient_name,

        d.name AS doctor_name,

        st.name AS staff_name

      FROM surgery s

      LEFT JOIN patient p
        ON s.patient_id = p.patient_id

      LEFT JOIN doctor d
        ON s.doctor_id = d.doctor_id

      LEFT JOIN staff st
        ON s.staff_id = st.staff_id

      ORDER BY s.surgery_id DESC
    `);


    res.json(result.rows);


  } catch (err) {

    console.error("Get surgeries error:", err);

    res.status(500).json({
      error: err.message
    });

  }
});



// =========================================
// GET SURGERY REQUESTS FOR STAFF
// =========================================

router.get("/requests/all", async (req, res) => {

  try {

    const result = await pool.query(`

      SELECT

        s.*,

        p.name AS patient_name,

        d.name AS doctor_name

      FROM surgery s


      LEFT JOIN patient p
        ON s.patient_id = p.patient_id


      LEFT JOIN doctor d
        ON s.doctor_id = d.doctor_id


      WHERE s.status IN (
        'recommended',
        'scheduled'
      )


      ORDER BY s.surgery_id DESC

    `);


    res.json(result.rows);


  } catch(err){

    console.error(
      "Surgery requests error:",
      err
    );


    res.status(500).json({
      error: err.message
    });

  }

});



// =========================================
// GET DOCTOR SURGERIES
// =========================================

router.get("/doctor/:doctorId", async(req,res)=>{

  try{


    const result = await pool.query(`

      SELECT

        s.*,

        p.name AS patient_name,

        st.name AS staff_name


      FROM surgery s


      LEFT JOIN patient p
        ON s.patient_id = p.patient_id


      LEFT JOIN staff st
        ON s.staff_id = st.staff_id


      WHERE s.doctor_id=$1


      ORDER BY s.surgery_id DESC


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
// GET PATIENT SURGERIES
// =========================================


router.get("/patient/:patientId", async(req,res)=>{


try{


const result = await pool.query(`


SELECT

s.*,

d.name AS doctor_name,

st.name AS staff_name


FROM surgery s


LEFT JOIN doctor d
ON s.doctor_id=d.doctor_id


LEFT JOIN staff st
ON s.staff_id=st.staff_id


WHERE s.patient_id=$1


ORDER BY s.surgery_id DESC


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
// DOCTOR RECOMMEND SURGERY
// =========================================


router.post("/doctor/recommend", async(req,res)=>{


const {

patient_id,

doctor_id,

surgery_name,

type

}=req.body;



try{


if(!patient_id || !doctor_id || !surgery_name){

return res.status(400).json({

error:
"Patient, doctor and surgery name are required"

});

}



const result = await pool.query(`


INSERT INTO surgery

(

patient_id,

doctor_id,

surgery_name,

type,

status

)


VALUES

($1,$2,$3,$4,'recommended')


RETURNING *


`,
[
patient_id,
doctor_id,
surgery_name,
type || null
]

);



res.status(201).json({

message:
"Surgery recommended successfully",

surgery:
result.rows[0]

});



}catch(err){

res.status(500).json({

error:err.message

});

}


});




// =========================================
// STAFF SCHEDULE SURGERY
// =========================================


router.patch("/:id/staff-schedule", async(req,res)=>{


const {

staff_id,

date

}=req.body;



try{


if(!staff_id || !date){

return res.status(400).json({

error:
"staff_id and date are required"

});

}



const check = await pool.query(`

SELECT staff_id

FROM staff

WHERE staff_id=$1

`,
[
staff_id
]);



if(check.rows.length===0){

return res.status(404).json({

error:
"Staff not found"

});

}




const result = await pool.query(`


UPDATE surgery


SET

staff_id=$1,

date=$2,

status='scheduled'


WHERE surgery_id=$3


AND status IN
(
'recommended',
'scheduled'
)


RETURNING *


`,
[
staff_id,
date,
req.params.id
]

);



if(result.rows.length===0){

return res.status(404).json({

error:
"Surgery not found"

});

}



res.json({

message:
"Surgery scheduled successfully",

surgery:
result.rows[0]

});




}catch(err){

res.status(500).json({

error:err.message

});

}


});




// =========================================
// GET SINGLE SURGERY
// =========================================


router.get("/:id", async(req,res)=>{


try{


const result = await pool.query(`


SELECT

s.*,

p.name AS patient_name,

d.name AS doctor_name,

st.name AS staff_name


FROM surgery s


LEFT JOIN patient p
ON s.patient_id=p.patient_id


LEFT JOIN doctor d
ON s.doctor_id=d.doctor_id


LEFT JOIN staff st
ON s.staff_id=st.staff_id


WHERE s.surgery_id=$1


`,
[
req.params.id
]

);



if(result.rows.length===0){

return res.status(404).json({

error:
"Surgery not found"

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
// UPDATE SURGERY
// =========================================


router.put("/:id", async(req,res)=>{


const {

patient_id,

doctor_id,

staff_id,

surgery_name,

date,

type,

status

}=req.body;



try{


const result = await pool.query(`


UPDATE surgery

SET


patient_id = COALESCE($1,patient_id),

doctor_id = COALESCE($2,doctor_id),

staff_id = COALESCE($3,staff_id),

surgery_name = COALESCE($4,surgery_name),

date = COALESCE($5,date),

type = COALESCE($6,type),

status = COALESCE($7,status)



WHERE surgery_id=$8


RETURNING *


`,
[
patient_id,
doctor_id,
staff_id,
surgery_name,
date,
type,
status,
req.params.id
]

);



if(result.rows.length===0){

return res.status(404).json({

error:
"Surgery not found"

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
// DELETE SURGERY
// =========================================


router.delete("/:id", async(req,res)=>{


try{


const result = await pool.query(`

DELETE FROM surgery

WHERE surgery_id=$1

RETURNING surgery_id


`,
[
req.params.id
]

);



if(result.rows.length===0){

return res.status(404).json({

error:
"Surgery not found"

});

}



res.json({

message:
"Surgery deleted successfully"

});



}catch(err){

res.status(500).json({

error:err.message

});

}


});



module.exports = router;