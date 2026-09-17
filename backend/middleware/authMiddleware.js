const jwt = require("jsonwebtoken");


const generateToken = (userId, role) => {

    return jwt.sign(
        {
            id: userId,
            role: role
        },

        process.env.JWT_SECRET,

        {
            expiresIn:
            process.env.JWT_EXPIRE || "1d"
        }
    );

};



const verifyToken = (req,res,next)=>{

    try{

        const authHeader =
        req.headers.authorization;


        if(!authHeader){

            return res.status(401).json({

                success:false,

                message:"Authorization token missing"

            });

        }



        const token =
        authHeader.split(" ")[1];



        if(!token){

            return res.status(401).json({

                success:false,

                message:"Invalid token format"

            });

        }



        const decoded =
        jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        req.user = decoded;


        next();



    }catch(error){


        return res.status(401).json({

            success:false,

            message:"Invalid or expired token"

        });


    }

};



module.exports = {
    generateToken,
    verifyToken
};