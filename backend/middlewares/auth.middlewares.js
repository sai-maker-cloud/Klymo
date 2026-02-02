const jwt = require('jsonwebtoken');

const auth = async (req,res,next) => {
    const {token} = req.cookies;

    if(!token){
        return res.status(401).json({success: false, message: "Please login first"});
    }

    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY);
        req.user = await User.findById(decoded.id);
        next();
    }catch(err){
        return res.status(500).json({success: false, err})
    }
}

module.exports = {auth};