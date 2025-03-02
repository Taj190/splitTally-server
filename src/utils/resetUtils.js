// helpers/resetUtils.js

// Function to get the most recent reset from the resetHistory array
const getMostRecentReset = (group) => {
    if (group.resetHistory && group.resetHistory.length > 0) {
      // Get the most recent reset from the history (last entry)
      return group.resetHistory[group.resetHistory.length - 1].resetAt;
    }
    return null; // No reset found, return null
  };
  
  // Function to filter transactions based on reset date
 export const ApplyResetFilter = (group, filter) => {
    const mostRecentReset = getMostRecentReset(group);
    if (mostRecentReset) {
      // If there's a reset, filter transactions after the most recent reset
      filter.createdAt = { $gt: mostRecentReset }; // Apply filter based on reset
    }
    return filter;
  };
  
 
  