import { config } from "../../dbConfig/paginationConfig.js";
import User from "../../schema/GooglesignUp.js";
import Group from "../../schema/GroupSchema/Groupschema.js";


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
    let userId = req.user._id
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


export{
    CreateGroupController,
    GetGroupNameController
}


