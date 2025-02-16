import Transaction from "../../schema/AddTransactionSchema/TransactionSchema.js";
import Group from "../../schema/GroupSchema/Groupschema.js";
import User from "../../schema/SignupSchema/GooglesignUp.js";




export const AddTransactionController = async (req, res) => {
    const { description, amount, groupId, transparencyMode } = req.body;
    let initiator = req.query.initiator;
     
    // if(req.user.email_verified){
    //  const Id = req.user.sub; 
    //  const existingUser = await User.findOne({ googleId:Id  })
    //  initiator = existingUser._id
    // }
  
    try {
      // Find the group and members
      const group = await Group.findById(groupId).populate('members');
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }
  
      // Create the transaction data
      let transactionData = {
        description,
        amount,
        initiator,
        group: groupId,
        transparencyMode
      };
  
      if (transparencyMode) {
        // Transparency mode: Need approval from other members
        const verifications = new Map();
  
        // Set the initiator's status as 'approved' automatically
        verifications.set(initiator.toString(), 'approved');
  
        // Set other members' status as 'pending'
        group.members.forEach(member => {
          if (member._id.toString() !== initiator.toString()) { // Don't need approval from the initiator
            verifications.set(member._id.toString(), 'pending');
          }
        });
  
        // Add the verifications map to the transactionData
        transactionData.verifications = verifications;
        transactionData.status = 'pending'; // Transaction status remains pending until everyone approves
      } else {
        // If transparency mode is off, directly add to initiator's account without approval
        transactionData.status = 'approved';
      }
  
      // Save the transaction
      const transaction = new Transaction(transactionData);
      await transaction.save();

      const pendingApprovals = [];
      for (const [userId, status] of transaction.verifications) {
        if (status === 'pending') {
          const user = await User.findById(userId).select('name');
          pendingApprovals.push(user); // Add user details to the pendingApprovals array
        }
      }
      
      
      if (transaction.transparencyMode) {
          // If transparency is ON, populate the initiator and verifications
          const populatedTransaction = await Transaction.findById(transaction._id)
              .populate('initiator', 'name') // Fetch initiator's name
          res.json({
              success: true,
              message: "Transaction Added Successfully (Pending Approvals)",
              populatedTransaction,
              pendingApprovals 
          });
      } else {
          // If transparency is OFF, return transaction without verifications
          res.json({
              success: true,
              message: "Transaction Added Successfully (Directly Approved)",
              transaction,
             
          });
      }
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  // Approve or cancel the verification for a transaction
  export const VerifyTransaction = async (req, res) => {
    const { transactionId, status } = req.body; // status: "approved" or "cancelled"
    let userId = req.query._id
    // if(req.user.email_verified){
    //  const Id = req.user.sub; 
    //  const existingUser = await User.findOne({ googleId:Id  })
    //  userId = existingUser._id
    // }
  
    try {
      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        return res.status(404).json({ 
            success: false,
            message: 'Transaction not found' });
      }
  
      // Check if the user is part of the group and should approve the transaction
      if (!transaction.verifications.has(userId.toString())) {
        return res.status(403).json({
            success : false,
            message: 'You are not authorized to verify this transaction' });
      }
  
      // Update the verification status for the user
      transaction.verifications.set(userId.toString(), status);
  
      // If all members approve (except the initiator), update the transaction status to approved
      const allApproved = Array.from(transaction.verifications.values()).every(
        verifStatus => verifStatus === 'approved'
      );
  
      if (allApproved) {
        transaction.status = 'approved';
      }
  
      await transaction.save();
  
      res.status(200).json({
        success : true ,
        message : ' Your action has been recorded',
        transaction
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  