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
    .select('name ');

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
      const userId = req.user.email_verified
      ? (await User.findOne({ googleId: req.user.sub }))._id
      : req.user._id;
       try {
          const group = await Group.findById({_id}).populate("members", "name email");
         
            if (!group) {
          return res.status(404).json({
            success:false,
            message: "Group not found" });
       }
         res.json({ _id: group._id, name: group.name, members: group.members ,  });

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

const UpdatePrivacyModeController = async (req, res) => {
    let userId = req.user._id;
    const { groupId } = req.body;
    if(req.user.email_verified){
        const Id = req.user.sub; 
        const existingUser = await User.findOne({ googleId:Id  })
        userId = existingUser._id
       }
  
    try {
        // Check if user is logged in with Google or Email/Password
        const user =  await User.findOne({_id : userId})
           

        // Ensure user exists and is part of the group
        if (!user || !user.groups.includes(groupId)) {
            return res.status(401).json({
                success: false,
                message: 'You are not authorized to toggle status for this group.'
            });
        }

        // Check if the group exists (to prevent data inconsistency)
        const group = await Group.findById({_id: groupId});
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found.'
            });
        }

        const now = new Date();

        // Check if 30 days have passed since last toggle limit
        if (group.toggleBlockedUntil && now >= group.toggleBlockedUntil) {
            group.toggleCount = 0;
            group.toggleBlockedUntil = null;
        }

        // Check if toggle limit is reached
        if (group.toggleCount >= 3) {
            return res.status(403).json({
                success: false,
                message: `Privacy Mode toggling is locked until ${group.toggleBlockedUntil.toDateString()}`,
            });
        }

        // Toggle privacy mode
        group.privacyMode = !group.privacyMode;
        group.lastToggledBy = userId;
        group.toggleCount += 1;
        group.lastToggleTimestamp = now;

        // If toggle count reaches 3, set block time for 30 days
        if (group.toggleCount >= 3) {
            const unlockDate = new Date();
            unlockDate.setDate(unlockDate.getDate() + 30);
            group.toggleBlockedUntil = unlockDate;
        }

        await group.save();

        return res.status(200).json({
            success: true,
            message: `Privacy mode has been switched ${group.privacyMode ? 'On' : 'Off'}.`,
            group
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while changing the privacy mode.'
        });
    }
};

const PrivacyModeDetailController = async (req, res) => {
    const { groupId } = req.query;
    try {
        const group = await Group.findById(groupId).populate('lastToggledBy', 'name');
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found.'
            });
        }

        const now = new Date();
        let daysLeft = null;
        if (group.toggleBlockedUntil && now < group.toggleBlockedUntil) {
            daysLeft = Math.ceil((group.toggleBlockedUntil - now) / (1000 * 60 * 60 * 24));
        }

        res.status(200).json({
            success: true,
            privacyMode: group.privacyMode,
            attemptsLeft: 3 - group.toggleCount,
            lastUpdatedBy: group.lastToggledBy ? group.lastToggledBy.name : 'No recent updates',
            daysUntilReset: daysLeft
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'I think there is something went wrong'
        });
    }
};





export{
    CreateGroupController,
    GetGroupNameController,
    GroupNameController,
    AddMemberController,
    UpdatePrivacyModeController ,
    PrivacyModeDetailController 
}


