const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const db = require("../db");


// JWT SECRET

const JWT_SECRET =
    process.env.JWT_SECRET || "medicare_secret_key";




// =====================================================
// REGISTER
// POST /api/auth/register
// =====================================================


router.post("/register", async (req,res)=>{


    try{


        const {
            email,
            password,
            role
        } = req.body;




        if(!email || !password || !role){

            return res.status(400).json({

                message:
                "Email, password and role are required"

            });

        }





        const allowedRoles = [

            "admin",
            "doctor",
            "staff",
            "patient"

        ];





        if(!allowedRoles.includes(role)){


            return res.status(400).json({

                message:
                "Invalid role"

            });


        }






        const existing =
        await db.query(

            `
            SELECT *
            FROM users
            WHERE email=$1
            `,

            [email]

        );






        if(existing.rows.length > 0){


            return res.status(409).json({

                message:
                "Email already registered"

            });


        }







        const hashedPassword =
        await bcrypt.hash(password,10);







        const result =
        await db.query(

            `
            INSERT INTO users
            (
                email,
                password,
                role
            )

            VALUES($1,$2,$3)

            RETURNING
            user_id,
            email,
            role
            `,


            [

                email,

                hashedPassword,

                role

            ]


        );







        res.status(201).json({

            message:
            "User registered successfully",


            user:
            result.rows[0]

        });





    }

    catch(error){


        console.log(error);


        res.status(500).json({

            message:
            error.message

        });


    }



});









// =====================================================
// LOGIN
// POST /api/auth/login
// =====================================================


router.post("/login", async(req,res)=>{


    try{


        const {

            email,
            password

        } = req.body;





        if(!email || !password){


            return res.status(400).json({

                message:
                "Email and password required"

            });


        }







        const result =
        await db.query(

            `
            SELECT *
            FROM users
            WHERE email=$1
            `,

            [email]

        );







        if(result.rows.length===0){


            return res.status(401).json({

                message:
                "Invalid email or password"

            });


        }






        const user =
        result.rows[0];








        const match =
        await bcrypt.compare(

            password,

            user.password

        );








        if(!match){


            return res.status(401).json({

                message:
                "Invalid email or password"

            });


        }








        // =========================================
        // GET ROLE PROFILE
        // =========================================


        let profile = {};






        if(user.role==="doctor"){



            const doctor =
            await db.query(

                `
                SELECT

                doctor_id,
                name,
                email,
                phone,
                status,
                specialization,
                dept_id

                FROM doctor

                WHERE email=$1

                `,

                [email]

            );



            if(doctor.rows.length>0){

                profile =
                doctor.rows[0];

            }


        }







        else if(user.role==="staff"){



            const staff =
            await db.query(

                `
                SELECT

                staff_id,
                name,
                email,
                phone,
                dept_id

                FROM staff

                WHERE email=$1

                `,

                [email]

            );



            if(staff.rows.length>0){

                profile =
                staff.rows[0];

            }


        }







        else if(user.role==="patient"){



            const patient =
            await db.query(

                `
                SELECT

                patient_id,
                name,
                email,
                phone,
                dob,
                gender,
                blood_group

                FROM patient

                WHERE email=$1

                `,

                [email]

            );



            if(patient.rows.length>0){

                profile =
                patient.rows[0];

            }


        }







        else if(user.role==="admin"){


            profile={

                admin_id:user.user_id,
                email:user.email

            };


        }








        // =========================================
        // JWT TOKEN
        // =========================================


        const token =

        jwt.sign(

            {

                user_id:user.user_id,

                email:user.email,

                role:user.role

            },


            JWT_SECRET,


            {

                expiresIn:"2h"

            }


        );








        res.status(200).json({


            message:
            "Login successful",



            token,



            user:{


                user_id:user.user_id,


                email:user.email,


                role:user.role,



                ...profile


            }



        });








    }

    catch(error){


        console.log(error);



        res.status(500).json({

            message:
            "Server error"

        });


    }



});









// =====================================================
// LOGOUT
// =====================================================


router.post("/logout",(req,res)=>{


    res.json({

        message:
        "Logout successful"

    });


});








module.exports = router;