import Transaction from "../schema/AddTransactionSchema/TransactionSchema.js";

export const getGroupTransactions = async (groupId) => {
    try {
       
        const currentDate = new Date();
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(currentDate.getMonth() - 2); 

       
        const transactions = await Transaction.find({
            group: groupId,
            date: { $gte: twoMonthsAgo, $lte: currentDate } 
        }).populate('group', 'name'); 

        const formattedTransactions = transactions.map(transaction => ({
            category: transaction.description,
            amount: transaction.amount,
            month: transaction.date.toLocaleString('default', { month: 'long' }), // Get month name
        }));

        return formattedTransactions;  // Return the formatted transactions
    } catch (error) {
        console.error("Error fetching transactions:", error.message);
        return [];  // Return an empty array if something goes wrong
    }
};
