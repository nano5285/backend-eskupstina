const AUTH = require("./auth");
const Agenda = require("./agenda");
const Vote = require("./vote");
const PDF = require("./pdf");
const multer = require("multer");
const Session = require("./session");
const upload = multer();
const API = (router) => {
  // APIs for Auth
  router.get("/test", (req, res) => {
    res.send("Hello World!");
  });
  router.post("/login", AUTH.login);
  router.get("/get_agenda", Agenda.get_agenda);
  router.get("/get_all_agendas", Agenda.get_agendas);
  router.post("/agenda", upload.single("pdf_path"), Agenda.createAgenda);
  router.get("/get_agenda_by_id", Vote.get_vote);
  router.post("/users", AUTH.get_users);
  router.get("/tv-users", AUTH.get_tv_users);
  router.get("/pdf", Agenda.show_pdf);
  router.get("/pdf-blob", PDF.get_pdf_blob);
  router.get("/live_votes", Agenda.live_votes);
  router.post("/record_live_vote", Agenda.record_live_vote);
  router.post("/vote", Agenda.do_vote);
  router.get("/get_vote", Vote.get_vote);
  router.get('/get_session_or_latest', Session.get_session_or_latest);
  router.get("/get_sessions", Session.get_all_sessions);
  router.post("/start_vote", Agenda.start_vote);
  router.post("/close_vote", Agenda.close_vote);
  router.post("/reset_vote", Agenda.reset_vote);
  router.delete("/agenda/:id", Agenda.delete_agenda);
  router.delete("/session/:id", Session.delete_session);
  router.post("/create-session", Session.createSession);
  router.put("/update-session", Session.updateSession);
  router.put("/update-agenda", upload.single("pdf_path"), Agenda.updateAgenda);
  router.delete("/users/:id", AUTH.delete_user);
  router.post("/create-user", AUTH.createUser);
  router.put("/update-user", AUTH.updateUser);
  
  // New api's
  router.get("/users/list", AUTH.users_list);
  router.get("/sessions/list", AUTH.sessions_list);
  router.get("/agendas/list", AUTH.agendas_list);
  router.get("/agendavote/list/:userId", AUTH.agendas_list);


};

module.exports = API;
