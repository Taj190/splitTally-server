import axios from "axios";
import Group from "../../schema/GroupSchema/Groupschema.js";
import { getGroupTransactions} from "../../utils/groupTransactions.js";


export const GenerateReport = async (req, res) => {
    try {
        const { groupId } = req.body; 
        console.log(groupId)
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(400).json({ error: "Group not found." });
        }
        const groupCreatedDate = group.createdAt; // `createdAt` is automatically set by mongoose
        const currentDate = new Date();

        // Check if two months have passed since the group was created
        const twoMonthsAgo = new Date(currentDate.setMonth(currentDate.getMonth() - 2));
        if (groupCreatedDate > twoMonthsAgo) {
            return res.status(400).json({ error: "Group must be active for at least two months to generate a report." });
        }

        // Check if the report was already generated and if it has been less than a month
        const lastReportDate = group.reportGeneratedAt;
        const nextReportAvailableDate = group.nextReportAvailableAt;
        if (lastReportDate && nextReportAvailableDate && new Date() < nextReportAvailableDate) {
            return res.status(400).json({
                error: `A report has already been generated. The next report is available on ${nextReportAvailableDate.toLocaleDateString()}.`
            });
        }

        // Fetch transactions for the group (from the last two months)
        const transactions = await getGroupTransactions(groupId);

        // If no transactions found, return error
        if (!transactions || transactions.length === 0) {
            return res.status(400).json({ error: "No transactions found for this group." });
        }

        const systemPrompt = `Analyze transactions from the two most recent months. 
        Return JSON with:
        1. last_two_months: array of month names sorted chronologically
        2. categories: array with category name and amounts per month
        3. advice: actionable spending tips
        
        Format:
        {
          "last_two_months": ["Month1", "Month2"],
          "categories": [
            { "name": "Category", "Month1": X, "Month2": Y, "difference": Z }
          ],
          "advice": ["tip1", "tip2"]
        }`;
        
        const response = await axios.post(
          "https://api.deepseek.com/v1/chat/completions",
          {
            model: "deepseek-chat",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: JSON.stringify(transactions) }
            ]
          },
          {headers: {
            "Authorization": `Bearer ${process.env.DEEPSEEK_KEY}`,
            "Content-Type": "application/json"
          } }
        );
  
 

       
       const rawContent = response.data.choices[0].message.content;

        // Extract JSON from markdown code block
         const jsonString = rawContent
         .replace(/```json/g, '')
         .replace(/```/g, '')
         .trim();

     
     const analysisData = JSON.parse(jsonString);
      const transformedData = {
       months: analysisData.last_two_months,
       categories: analysisData.categories.map(cat => ({
         name: cat.name.trim().toLowerCase(),
         [analysisData.last_two_months[0]]: cat[analysisData.last_two_months[0]],
         [analysisData.last_two_months[1]]: cat[analysisData.last_two_months[1]],
         difference: cat.difference
       })),
       advice: analysisData.advice
     };

     const now = new Date();
     const nextReportDate = new Date();
     nextReportDate.setMonth(nextReportDate.getMonth() + 1);
     group.reportGeneratedAt = now;
     group.nextReportAvailableAt = nextReportDate;
     group.analysis = transformedData;
     await group.save();
     res.status(200).json({
      success : true ,
      transformedData
     }) 

    } catch (error) {
        console.error("DeepSeek API Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to generate spending report." });
    }
};

// to decide which button or text we show in front end this controller will decide 
export const GetAIReportStatus = async (req, res) => {
  try {
    const { groupId } = req.params; // Assuming groupId is passed in the request body
    
    // Fetch the group based on the provided groupId
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        error: 'Group not found.'
      });
    }

    // Get current date and group creation date
    const currentDate = new Date();
    const groupCreationDate = group.createdAt;
    const nextReportAvailableDate = group.nextReportAvailableAt;

    // Check if the group is eligible for report generation
    const twoMonthsPassed = currentDate - groupCreationDate >= 2 * 30 * 24 * 60 * 60 * 1000; // 2 months in milliseconds

    if (!twoMonthsPassed) {
      return res.status(200).json({
        status: 'Not eligible',
        message: 'Your AI report generation option will appear here once 2 months have passed. Thanks for your patience.'
      });
    }

    // Check if the report is available or can be generated
    if (nextReportAvailableDate > currentDate) {
      return res.status(200).json({
        status: 'Report Pending',
        message: `A report has already been generated. The next report is available on ${nextReportAvailableDate.toLocaleDateString()}.`
      });
    }

    // If report is available, show "Generate Report" button
    return res.status(200).json({
      status: 'Generate Report',
      message: 'Click to generate AI report.'
    });
  } catch (error) {
    console.error('Error fetching group AI report status:', error);
    return res.status(500).json({
      error: 'Server error, unable to fetch report status.'
    });
  }
};

// if report is available then show it ..
export const GetReport = async (req, res) => {
    try {
        const { groupId } = req.params; 
     
        // Fetch the group by groupId
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Check if the report is available
        if (!group.analysis || !group.reportGeneratedAt) {
            return res.status(400).json({ error: 'Report not available yet. Please try again later.' });
        }

        // Send back the AI report
        const content = group.analysis;
        return res.status(200).json({ 
            success: true,
            content 
        });

    } catch (error) {
        console.error('Error fetching report:', error);
        return res.status(500).json({ error: 'An error occurred while fetching the report' });
    }
};







