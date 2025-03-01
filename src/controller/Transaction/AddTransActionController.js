import { config } from "../../dbConfig/paginationConfig.js";
import Transaction from "../../schema/AddTransactionSchema/TransactionSchema.js";
import Group from "../../schema/GroupSchema/Groupschema.js";
import User from "../../schema/SignupSchema/GooglesignUp.js";



// to add new transaction
export const AddTransactionController = async (req, res) => {
    const { description, amount, groupId} = req.body;
    let initiator  = req.user._id;
     
    if(req.user.email_verified){
     const Id = req.user.sub; 
     const existingUser = await User.findOne({ googleId:Id  })
     initiator = existingUser._id
    }
  
    try {
      // Find the group and members
      const group = await Group.findById(groupId).populate('members');
      if (!group) {
        return res.status(404).json({
          success : false,
          message: 'Group not found' });
      }
      let mode = group.privacyMode ;
      // Create the transaction data
      let transactionData = {
        description,
        amount,
        initiator,
        group: groupId,
        transparencyMode : mode
      };
  
      if (mode) {
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
      if (transaction.transparencyMode) {
        for (const [userId, status] of transaction.verifications) {
          if (status === 'pending') {
            const user = await User.findById(userId).select('name');
            pendingApprovals.push(user); // Add user details to the pendingApprovals array
          }
        }
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
    const { transactionId, status } = req.body;
    let userId = req.user._id
    if(req.user.email_verified){
     const Id = req.user.sub; 
     const existingUser = await User.findOne({ googleId:Id  })
     userId = existingUser._id
    }

    try {
      const transaction = await Transaction.findById({_id : transactionId});
     
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

  
export const GetTransactionsController = async (req, res) => {
  try {
    const { groupId, page  } = req.query;
    const limit = config.LIMIT;
    const skip = (page - 1) * limit;

    // Extract userId dynamically based on login method
    const userId = req.user.email_verified
      ? (await User.findOne({ googleId: req.user.sub }))._id
      : req.user._id;

    // Fetch transactions for the group with pagination
    const transactions = await Transaction.find({ group: groupId })
      .populate("initiator", "name") // Populate initiator's name
      .skip(skip)
      .limit(limit)
      .lean(); // Convert to plain objects

      const totaltransaction= await Transaction.countDocuments({  group: groupId });
    // Process transactions to get pending approvals
    const transactionsWithApprovals = await Promise.all(
      transactions.map(async (transaction) => {
        const pendingApprovals = [];

        if (transaction.transparencyMode) {
          for (const [verifierId, status] of Object.entries(transaction.verifications)) {
            if (status === "pending") {
              const user = await User.findById(verifierId).select("name");
              if (user) pendingApprovals.push(user);
            }
          }
        }

        return {
          ...transaction,
          pendingApprovals,
        };
      })
    );

    res.json({
      success: true,
      transactions: transactionsWithApprovals,
      currentPage: page,
      totalPages: Math.ceil(totaltransaction / limit),
      userId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
// this for updating the existing transaction if needed
export const EditTransActionController = async (req, res) => {
  const { transactionId } = req.params;
  const { updatedData } = req.body;
  // Extract userId based on Google auth or standard user
  const userId = req.user.email_verified
    ? (await User.findOne({ googleId: req.user.sub }))._id
    : req.user._id;
  
  try {
    // Find the transaction by ID
    const transaction = await Transaction.findById({ _id: transactionId });
    
    // Check if the user is the initiator
    if (transaction.initiator.toString() !== userId.toString()) {
      return res.status(401).json({
        success: false,
        message: 'You are not authorized to edit this transaction. Good Bye!'
      });
    }

    // Proceed with the update if the user is authorized
    transaction.description = updatedData.description || transaction.description;
    transaction.amount = updatedData.amount || transaction.amount;

    // this loop we are running when a initiator edit its transaction then again 
    // //we set the status to pending so other can verify it 
    const status = 'pending' ;
    if (transaction.transparencyMode){
      for (const [Id, status ] of transaction.verifications) {
        if(Id.toString()!== userId.toString()){
          transaction.verifications.set(Id.toString(), 'pending');
        }
      }
    }
    transaction.status = status;
    await transaction.save(); // Save the updated transaction

    return res.status(200).json({
      success: true,
      message: 'Transaction updated successfully!',
      transaction
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Could not update the transaction.'
    });
  }
};

// this is for edit transaction .. to get that particular transaction detail
 export const GetSingleTransactionDetailController = async (req, res)=>{
  const { transactionId } = req.params;
  // Extract userId based on Google auth or standard user
  const userId = req.user.email_verified
    ? (await User.findOne({ googleId: req.user.sub }))._id
    : req.user._id;
    try {
          // Find the transaction by ID
    const transaction = await Transaction.findById({ _id: transactionId });
    
    // Check if the user is the initiator
    if (transaction.initiator.toString() !== userId.toString()) {
      return res.status(401).json({
        success: false,
        message: 'You are not authorized to edit this transaction. Good Bye!'
      });
    }
    return res.status(200).json({
      success : true ,
      description : transaction.description,
      amount : transaction.amount
    })

    } catch (error) {
      res.status(500).json({
        success : false ,
        message : 'Something went Wrong'
      })
      
    }
 }

 // this is for delete transaction
 export const DeleteTransactionController = async (req, res) => {
   const { transactionId } = req.params; // Get transactionId from request params
   const userId = req.user.email_verified
     ? (await User.findOne({ googleId: req.user.sub }))._id
     : req.user._id;
 
   try {
     // Find the transaction by ID
     const transaction = await Transaction.findById({_id: transactionId});
 
     if (!transaction) {
       return res.status(404).json({
         success: false,
         message: 'Transaction not found.',
       });
     }
 
     // Check if the user is the one who created the transaction (initiator)
    //  if (!transaction.initiator.equals(userId)) {
    //    return res.status(401).json({
    //      success: false,
    //      message: 'You are not authorized to delete this transaction.',
    //    });
    //  }
 
     // Delete the transaction
     await Transaction.findByIdAndDelete({_id : transactionId});
 
     return res.status(200).json({
       success: true,
       message: 'Transaction deleted successfully.',
     });
   } catch (error) {
     console.error(error);
     return res.status(500).json({
       success: false,
       message: 'An error occurred while deleting the transaction.',
     });
   }
 };

 // Get transaction details securely
export const GetTransactionDetailsController = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.email_verified
    ? (await User.findOne({ googleId: req.user.sub }))._id
    : req.user._id;
  
    // Fetch transaction and populate initiator & group
    const transaction = await Transaction.findById(transactionId)
      .populate("initiator", "name _id")
      .populate("group", "name _id members");

    if (!transaction) {
      return res.status(404).json({ 
        success: false,
        message: "Transaction not found" });
    }

    // Ensure user is part of the group and authorized to view
    if (!transaction.group.members.includes(userId)) {
      return res.status(403).json({ error: "Unauthorized access" });
    }
  console.log(transaction.verifications)
    // Map verification status
    const approvedUserPromises = [];
    const pendingUserPromises = [];             
    const cancelUserPromises =[]  ;
    // Fetch the user details in parallel for approved and pending users
    for (const [userId, status] of transaction.verifications.entries()) {
      const userPromise = User.findById(userId).select("name _id");

      if (status === "approved") {
        approvedUserPromises.push(userPromise);
      } else if (status === "pending") {
        pendingUserPromises.push(userPromise);
      }else if(status === 'canceled'){
        cancelUserPromises.push(userPromise) ;
      }
    }

    // Wait for all promises to resolve
    const approvedUsers = await Promise.all(approvedUserPromises);
    const pendingUsers = await Promise.all(pendingUserPromises);
    const cancelUsers = await Promise.all(cancelUserPromises)
    res.status(200).json({
      success: true,
      description: transaction.description,
      amount: transaction.amount,
      status: transaction.status,
      initiator: transaction.initiator,
      group: transaction.group,
      approvedUsers,
      pendingUsers,
      cancelUsers 
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// total of group expenses  detail
export const GetTotalExpenseController = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Fetch all transactions for this group
    const transactions = await Transaction.find({ group: groupId })
    .populate('initiator', 'name _id')  
    .populate('group', 'name')
    .exec();

    if (!transactions.length) {
      return res.status(404).json({ success: false, message: "No transactions found for this group." });
    }

    const userContributions = {};
    let totalApproved = 0;
    let totalPending = 0;

    transactions.forEach(transaction => {
      const { initiator, status, amount } = transaction;
      const userId = initiator._id.toString();

      // Initialize user if not already initialized
      if (!userContributions[userId]) {
        userContributions[userId] = {
          name: initiator.name,
          approved: 0,
          pending: 0,
        };
      }

         // Separate the amounts by status
         if (status === 'approved') {
          userContributions[userId].approved += amount;
          totalApproved += amount;
        } else if (status === 'pending') {
          userContributions[userId].pending += amount;
          totalPending += amount;
        }
   

    });

    // Convert user contributions into an array
    const contributionArray = Object.values(userContributions);

    return res.status(200).json({
      success: true,
      contributionArray ,
      totalApproved,
      totalPending,
    });

  } catch (error) {
    console.error("Error fetching transaction details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// settlement controller 
export const GetSettlementAdjustmentController = async (req, res) => {
  try {
    const { groupId } = req.params;
  
    // Fetch all approved transactions for the given group
    const transactions = await Transaction.find({ group: groupId, status: "approved" });

    if (!transactions.length) {
      return res.status(404).json({ success: false, message: "No approved transactions found." });
    }

    // Calculate total approved amount
    let totalApprovedAmount = 0;
    const userExpenses = {};

    for (const transaction of transactions) {
      const { initiator, amount } = transaction;
      totalApprovedAmount += amount;
      userExpenses[initiator] = (userExpenses[initiator] || 0) + amount;
    }

    // Fetch all group members
    const group = await Group.findById(groupId).populate("members", "name _id");
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    const memberIds = group.members.map((m) => m._id.toString());
    const splitAmount = totalApprovedAmount / memberIds.length;

    const balances = memberIds.map((memberId) => ({
      userId: memberId,
      name: group.members.find((m) => m._id.toString() === memberId).name, // Attach name
      balance: (userExpenses[memberId] || 0) - splitAmount,
    }));

    balances.sort((a, b) => a.balance - b.balance); // Sort: Debtors first, Creditors last

    const settlements = [];
    let i = 0, j = balances.length - 1;

    while (i < j) {
      let debtor = balances[i];
      let creditor = balances[j];
      let settlementAmount = Math.min(Math.abs(debtor.balance), creditor.balance);

      if (settlementAmount > 0) {
        settlements.push({
          from: { id: debtor.userId, name: debtor.name },
          to: { id: creditor.userId, name: creditor.name },
          amount: parseFloat(settlementAmount.toFixed(2)), // Avoid floating point errors
        });

        debtor.balance += settlementAmount;
        creditor.balance -= settlementAmount;
      }

      if (Math.abs(debtor.balance) < 1e-6) i++;
      if (Math.abs(creditor.balance) < 1e-6) j--;
    }

    return res.status(200).json({
      success: true,
      totalApprovedAmount: parseFloat(totalApprovedAmount.toFixed(2)),
      splitAmount: parseFloat(splitAmount.toFixed(2)),
      settlements,
    });
  } catch (error) {
    console.error("Error fetching settlement data:", error);
  
    if (error.response) {
      console.error("Response error:", error.response);
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  
    if (error.request) {
      console.error("Request error:", error.request);
    }
  
    console.error("Error message:", error.message);
  }
  
};



 
  