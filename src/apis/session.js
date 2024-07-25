const controllers = require("../controllers");

const createSession = async (req, res) => {
  try {
    const { title, start_time, end_time } = req.body;

    const session = await controllers.Session.create({
      name: title,
      start_time: start_time,
      end_time: end_time,
      agendas: [],
    });

    res.status(200).json({ status: 1, data: session });
  } catch (error) {
    console.error("Error processing file upload:", error);
    res.status(500).json({ error: "Error processing file upload" });
  }
};
const updateSession = async (req, res) => {
  try {
    const { title } = req.body;
    const { id } = req.query;

    const session = await controllers.Session.update({
      name: title,
      id: id,
    });

    res.status(200).json({ status: 1, data: session });
  } catch (error) {
    console.error("Error processing file upload:", error);
    res.status(500).json({ error: "Error processing file upload" });
  }
};

// get_all_sessions
const get_all_sessions = async (req, res) => {
  try {
    const sessions = await controllers.Session.findAll();
    const agendas = (await controllers.Agenda.findAll());

    // New array to store organized data
    const organizedData = [];

    // Loop through sessions
    sessions.forEach((session) => {
      const sessionAgendas = agendas.filter((agenda) =>
        session.agendas.includes(agenda._id)
      );

      organizedData.push({
        id: session._id,
        name: session.name,
        agendas: sessionAgendas,
      });
    });

    res.status(200).json({ data: organizedData });
  } catch (error) {
    console.error("Error getting all sessions:", error);
    res.status(500).json({ error: "Error getting all sessions" });
  }
};

const delete_session = async (req, res, next) => {
  try {
    const session_item_id = req.params.id;
    if (!session_item_id) {
      res.status(400).json({ error: "session_item_id parameter is missing" });
      return;
    }
    const result = await controllers.Session.delete(session_item_id);
    console.log(result);
    if (result.deletedCount == 0) {
      res.status(404).json({ error: "Session item not found" });
      return;
    }

    res
      .status(200)
      .json({ status: 1, message: "Session item deleted successfully" });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  get_all_sessions,
  createSession,
  delete_session,
  updateSession,
};
