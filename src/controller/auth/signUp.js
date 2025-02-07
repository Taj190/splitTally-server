import { DataValidation, PasswordValidation } from "../../ middleware/authHelper.js";
import { VerifyCodeMiddleware } from "../../ middleware/verificationCodeMiddlware.js";
import User from "../../schema/GooglesignUp.js";
import Group from "../../schema/GroupSchema/Groupschema.js";
import PendingInvite from "../../schema/PendingInvitation/PendingInvitation.js";
import VerificationCode from "../../schema/verificationcode.js";
import { GenerateCode, generateToken}  from "../../utils/generateCode.js";
import { comparePassword, hashPassword } from "../../utils/hashPassword.js";
import SendVerificationEmail from "../../utils/sendEmail.js";


const SignUpGoogleController = async (req, res) => {
  const { name, email, password, googleId, isGoogleSignUp } = req.body;
 
 const invite = await PendingInvite.findOne({ email });
  try {
  
    if(isGoogleSignUp){
      const existingUser = await User.findOne({ email });

    // If the user already exists, handle Google sign-in or return an error
    if (existingUser) {
      if (!existingUser.isGoogleSignUp) {
        return res.status(404).json({
          success: false,
          message: 'User already exists. Please log in.',
        });
      } else {
       
        return res.status(200).json({
          success: true,
          message: 'Login successful',
        });
      }
    }

    // If user doesn't exist, create a new user with Google details
    const newUser = new User({
      name,
      email,
      googleId,
      isGoogleSignUp: true, // Mark as signed up via Google
    });

    await newUser.save(); // Save the new user to the database

    // this is responsible part for if user is going to sign up via invitation link from his/her email 
    
    if (invite) {
      // If the user was invited, add them to the group
      const group = await Group.findById(invite.groupId);
      if (group) {
        group.members.push(newUser._id);
        await group.save();
    
        // Update the user document to include this group
        newUser.groups.push(group._id);
        await newUser.save();
      }
    
      // Delete the invite from PendingInvites
      await PendingInvite.deleteOne({ email });
    }
    

    return res.status(201).json({
      success: true,
      message: 'Account sign-up completed',
    });
    }

  } catch (error) {
    console.error('Error during signup:', error);
    return res.status(500).json({ message: 'Error saving user' });
  }

  // If it's NOT a Google sign-up, proceed with email/password flow
  if (!isGoogleSignUp) {
    return VerifyCodeMiddleware(req, res, async () => {
      try {
        // Check if name, email, and password are provided
        if (!name || !email || !password) {
          return res.status(400).json({ message: 'Name, email, and password are required.' });
        }

        // Validate email, password, etc.
        const validationResult = DataValidation({ name, email, password });
        if (!validationResult.valid) {
          return res.status(400).json({ message: 'Validation failed.', errors: validationResult.errors });
        }

        // Check if the email already exists in the database
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: 'Email is already registered.' });
        }

        // Hash the password for storage
        const hashedPassword = await hashPassword(password);

        // Create a new user document with email/password
        const newUser = new User({
          name,
          email,
          password: hashedPassword,
        });

        await newUser.save();

    // this is responsible part for if user is going to sign up via invitation link from his/her email 
    
    if (invite) {
      // If the user was invited, add them to the group
      const group = await Group.findById(invite.groupId);
      if (group) {
        group.members.push(newUser._id);
        await group.save();
    
        // Update the user document to include this group
        newUser.groups.push(group._id);
        await newUser.save();
      }
    
      // Delete the invite from PendingInvites
      await PendingInvite.deleteOne({ email });
    }
        return res.status(201).json({
          success: true,
          message: 'User registered successfully!',
          user: newUser,
        });
      } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ message: 'An error occurred during signup.' });
      }
    });
  }
};
//login start
const LoginController = async (req, res) => {
  const { email, password } = req.body;
   const existingUser = await User.findOne({ email: email });
  try {
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'This email is not registered! Try with a registered email.'
      });
    }

    const isMatch = await comparePassword(password, existingUser.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password mismatch'
      });
    }

    // Generate JWT
    const token = generateToken(existingUser);
    

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Secure in production
      sameSite: 'Lax',
      maxAge: 1 * 60 * 60 * 1000, // 1 hour
      path : '/'
    });

    res.status(200).json({
      success: true,
      name : existingUser.name,
    
    });
    

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
//forgot start
const ForgotController = async (req, res )=>{
  const {email} = req.body ;

  const existingUser = await User.findOne({email:email});
  if(!existingUser){
    res.status(404).json({
      success:false,
      message:'This email is not register'
    })
  }
     try {
      const code = GenerateCode();
      // Set expiration time (10 minutes from now)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
 
      // Save the verification code to the database
      await VerificationCode.create({ email, code, expiresAt });
 
      // Send the verification code via email
      await SendVerificationEmail(email, code);

      res.status(201).json({
        success : true ,
        message : 'Code to reset password has been sent please check your email'
      })
     } catch (error) {
      res.status(500).json({
        success: false ,
        message: 'An error occurred while sending the verification code.'
      })
      
     }

}
const ResetPasswordController = async(req, res)=>{
  const {email,password} = req.body

  const PasswordValidationResult = PasswordValidation({password})
  if(!PasswordValidationResult.valid){
    return res.status(400).json({
      success:false,
      message: "Password must be at least 6 characters long and contain an uppercase letter, a number, and a special character."
    })
  }
  try {
    const user = await User.findOne({email})
    if(!user){
      return res.status(404).json({
        success:false ,
        message:"user doesnot exist"
      })
    }
    const hashedPassword = await hashPassword(password);
    user.password = hashedPassword
    await user.save()
    res.status(200).json({
      success:true,
      message:'Password has been Updated Successfully'
    })

  } catch (error) {
    res.status(500).json({ message: 'An error occurred during Updating Password.' });
  }

}


export{
  SignUpGoogleController,
  LoginController,
  ForgotController,
  ResetPasswordController
};




