import jwt from 'jsonwebtoken';


export const GenerateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};

export const generateToken = (user) => {
  return jwt.sign(
    {name: user.name,userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1h" } // Token expires in 1 hour
  );
};

 