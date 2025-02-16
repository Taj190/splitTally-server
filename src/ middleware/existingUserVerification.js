import User from "../schema/SignupSchema/GooglesignUp.js";


export const ExistingUserVerification = async(req, res , next)=>{
  const {email} = req.body ;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success:false,
        message: 'Email is already registered or code has been sent already.' });
    }
    next()
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'An error occurred during signup.' });
  }
}
export const IsUserMemberOfGroup = async (req, res , next)=>{
    const {email , groupId} = req.body ;
    try {
      const ExistingUser = await User.findOne({email});
      if(ExistingUser){
       
       // if user is part of platform then check he has joined the group for which he/she has been invited 
       if (ExistingUser.groups.includes(groupId)) {
           return res.status(400).json({ 
               success:false,
               message: "User is already a member of this group" });
       }
    } 
    next()
    } catch (error) {
        console.log(error) ;
        res.status(500).json({
          success: false ,
          message : 'An error ocuur while sending message'
        })
    }

}