import User from "../../schema/GooglesignUp.js";
import Group from "../../schema/GroupSchema/Groupschema.js";


const CreateGroupContyroller = async (req, res) => {
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

export default CreateGroupContyroller;
