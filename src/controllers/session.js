const { SessionSchema, AgendaSchema } = require("../models");

const Session = {
  create: async (props) => {
    const { name, start_time, end_time } = props;
    try {
      const newData = new SessionSchema({
        name: name,
        start_time: start_time,
        end_time: end_time,
        agendas: [],
      });

      const saveData = await newData.save();

      if (!saveData) {
        throw new Error("Database Error");
      }

      return saveData;
    } catch (err) {
      throw new Error(err.message);
    }
  },
  update: async (props) => {
    const { name, start_time, end_time, id } = props;


    try {
      const session = await SessionSchema.findOne({ _id: id });

      if (!session) {
        throw new Error("Session not found");
      }

      session.name = name || session.name;
      session.start_time = start_time || session.start_time;
      session.end_time = end_time || session.end_time;

      const updatedSession = await session.save();
      return updatedSession;
    } catch (err) {
      throw new Error(err.message);
    }
  },

  findAll: async (year) => {
    try {
      const allSessions = (await SessionSchema.find().sort({_id:-1}));

      if (year) {
        const filteredSessions = allSessions.filter((session) => {
          const sessionYear = new Date(session?.start_time).getFullYear().toString();
          return sessionYear === year;
        });
        return filteredSessions;
      }
      return allSessions;
    } catch (err) {
      throw new Error(err.message);
    }
  },
  findSessionOrLatest: async (sessionId) => {
    let session;
    if(sessionId) {
      session = SessionSchema.findById(sessionId)
        .populate('agendas')
        .lean();
    } else {
      // session = SessionSchema.findOne({})
      // .sort({ start_time: -1 }) // Sort by start_time in descending order (latest first)
      // .populate('agendas') // Populate agendas after sorting
      // .lean(); //
    
    
        session = SessionSchema.aggregate([
              {
                $addFields: {
                  start_time_as_date: {
                    $dateFromString: {
                      dateString: "$start_time"
                    }
                  }
                }
              },
              {
                $sort: { start_time_as_date: 1 } // Sort by converted date
              },
              {
                $limit: 1 // Since you want the latest one, limit to 1 result
              },
              {
                $lookup: {
                  from: 'agendas',
                  localField: 'agendas',
                  foreignField: '_id',
                  as: 'agendas'
                }
              }
            ]).exec();session = SessionSchema.aggregate([
        {
          $addFields: {
            start_time_as_date: {
              $dateFromString: {
                dateString: "$start_time"
              }
            }
          }
        },
        {
          $sort: { start_time_as_date: -1 } // Sort by converted date
        },
        {
          $limit: 1 // Since you want the latest one, limit to 1 result
        },
        {
          $lookup: {
            from: 'agendas',
            localField: 'agendas',
            foreignField: '_id',
            as: 'agendas'
          }
        }
      ]).exec();    
    
    
    }
    
    
    return session;
  },

  // Function to get all distinct years from start_time
  getDistinctYears: async () => {
    try {
      // Use MongoDB aggregation to extract the year and get distinct values
      const years = await SessionSchema.aggregate([
        {
          $project: {
            year: { $year: { $dateFromString: { dateString: "$start_time" } } }
          }
        },
        {
          $group: {
            _id: "$year"
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      // Extract the year values from the result
      const distinctYears = years.map(yearObj => yearObj._id);
      
      console.log("Distinct years:", distinctYears);
      return distinctYears;
    } catch (error) {
      console.error("Error getting distinct years:", error);
      throw error;
    }
  },


  // Function to get sessions grouped by year, sorted by most recent within each year
  getSessionsByYear: async () => {
    try {
      // Use MongoDB aggregation to extract the year and group sessions by year
      const result = await SessionSchema.aggregate([
        {
          // Step 1: Convert start_time to a date and extract the year
          $project: {
            year: { $year: { $dateFromString: { dateString: "$start_time" } } },
            name: 1,
            start_time: 1
          }
        },
        {
          // Step 2: Sort by start_time in descending order (most recent first)
          $sort: { start_time: -1 }
        },
        {
          // Step 3: Group by year and push session _id and name to an array
          $group: {
            _id: "$year",
            sessions: { $push: { _id: "$_id", name: "$name", start_time: "$start_time" } }
          }
        },
        {
          // Step 4: Sort the result by year in ascending order
          $sort: { _id: 1 }
        }
      ]);

      // Format the output as requested
      const sessionsByYear = {};
      result.forEach(yearGroup => {
        sessionsByYear[`${yearGroup._id}`] = yearGroup.sessions;
      });
      return sessionsByYear;
    } catch (error) {
      console.error("Error getting sessions by year:", error);
      throw error;
    }
  },



  removeAgenda: async (props) => {
    try {
      let agendaDeleted = false;
      const sessions = await SessionSchema.find();

      await Promise.all(
        sessions.map(async (session) => {
          const index = session.agendas.indexOf(props);
          if (index !== -1) {
            session.agendas.splice(index, 1);
            await session.save();
            agendaDeleted = true;
          }
        })
      );

      return agendaDeleted;
    } catch (err) {
      throw new Error(err.message);
    }
  },
  delete: async (props) => {
    try {
      const session = await SessionSchema.find({ _id: props });

      const agendas = session[0].agendas;
      const filter = { _id: { $in: agendas } };
      const res = await AgendaSchema.deleteMany(filter);
      const result = await SessionSchema.deleteOne({ _id: props });
      return result;
    } catch (err) {
      throw new Error(err.message);
    }
  },
};

module.exports = Session;
