import { config } from "../../dbConfig/paginationConfig.js";
import Group from "../../schema/GroupSchema/Groupschema.js";
import PendingInvite from "../../schema/PendingInvitation/PendingInvitation.js";
import User from "../../schema/SignupSchema/GooglesignUp.js";
import { SendInvitationEmail } from "../../utils/sendEmail.js";


const CreateGroupController = async (req, res) => {
    try {
        const { groupName } = req.body;  
        let userId = req.user._id
     
       if(req.user.email_verified){
        const Id = req.user.sub; 
        const existingUser = await User.findOne({ googleId:Id  })
        userId = existingUser._id
       }
       
        const newGroup = new Group({
            name: groupName,  // Set the group name
            members: [userId]  // Add the logged-in user as the first member
        });

        // Save the new group to the database
        await newGroup.save();

        // Update the user's groups array to include the new group
        await User.findByIdAndUpdate(userId, {
            $push: { groups: newGroup._id }  // Push the new group's _id to the user's groups array
        });

        return res.status(201).json({
            success: true,
            message: 'Group created successfully',
            group: newGroup  // Send the group object as the response
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Server error, unable to create group',
        });
    }
};

const GetGroupNameController = async (req, res)=>{
    let userId = req.user._id ;
    if(req.user.email_verified){
     const Id = req.user.sub; 
     const existingUser = await User.findOne({ googleId:Id  })
     userId = existingUser._id
    }
 
 try {
    const page = parseInt(req.query.page) || 1;  
    const limit = config.LIMIT;  // Use imported limit
    const skip = (page - 1) * limit;

    const groups = await Group.find({ members: userId })
    .skip(skip)
    .limit(limit)
    .select('name');

// Get the total count for pagination
const totalGroups = await Group.countDocuments({ members: userId });

res.status(200).json({
    success: true ,
    groups,
    totalPages: Math.ceil(totalGroups / limit),
    currentPage: Number(page),
})
 } catch (error) {
    console.error(error);
    return res.status(500).json({
        success: false,
        message: 'Server error, unable to fetch groups',
    });
 }

}


// this controller is responsible for fetching name of group along with groupId and membersList
const GroupNameController = async (req, res)=>{
   
    const {_id} = req.query
    
       try {
          const group = await Group.findById({_id}).populate("members", "name email");
         
            if (!group) {
          return res.status(404).json({
            success:false,
            message: "Group not found" });
       }
         res.json({ _id: group._id, name: group.name, members: group.members });

       } catch (error) {
        console.log (error)
        res.status(500).json({
            success: false ,
            message : 'Internal error'
        })
        
       }
}

const AddMemberController = async (req, res)=>{
    const {email, code , groupId , name}= req.body ;
  
    
    try {
        //checking group exist or not
        const ExistingGroup = await Group.findOne({ _id: groupId });
        if (!ExistingGroup) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }
      // second step to consfim that user  is a part of Platform or not 
        const ExistingUser = await User.findOne({email});
       if(ExistingUser){
              //  $addToSet:  we have used it beacuse it prevent the duplicate entry in array automatically 
              // unlike push method  adding  blindly , it add new element if already not part of document.
             await User.updateOne(
            { _id: ExistingUser._id },
            { $addToSet: { groups: groupId } } // Add only if not already present
        );

        await Group.updateOne(
            { _id: groupId },
            { $addToSet: { members: ExistingUser._id } } // Add only if not already present
        );

           return res.status(201).json({
                success: true ,
                message : 'new member has been added'
            })
        

       } 
       else{
             const existingInvitation = await PendingInvite.findOne({email}) ;

             if(existingInvitation){
                return res.status(400).json({
                    success: false ,
                    message : 'Invitation to this user already sent !'
                })
             }
             
             try {
                const invitation  = new PendingInvite({
                    email ,
                    groupId,
                    verificationCode : code

                })
                await invitation.save()
                await SendInvitationEmail(email , code , name )
                return res.status(200).json({
                    success: true ,
                    message : 'invitation has been sent to given email address'
                })
             } 
             
             catch (error) {
               return res.status(500).json({
                success : false ,
                message : 'an occur while sending invitaion '
              })
                
             }
       }

    }catch (error) {
        res.status(500).json({
            success : false ,
            message : 'Something went worng'
        })
        
    }
}


export{
    CreateGroupController,
    GetGroupNameController,
    GroupNameController,
    AddMemberController
}


