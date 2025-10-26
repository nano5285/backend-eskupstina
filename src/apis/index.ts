import { Router } from "express";
import {
  createAgenda,
  getAgendas,
  getAgendaById,
  deleteAgenda,
  getAgendaPdf,
  getAgendaPdfBlob,
} from "../controllers/agenda";
import {
  login,
  register,
  getUsers,
  deleteUser,
  getTvUsers,
} from "../controllers/auth";
import {
  startVote,
  handleVote,
  closeVote,
  resetVote,
} from "../controllers/vote";
import {
  getLatestSessionOrActive,
  getSessionsByYear,
} from "../controllers/session"; // <-- 1. UVEZI NOVE KONTROLERE

const router = Router();

// Auth
router.post("/auth/login", login);
router.post("/auth/register", register);
router.post("/auth/get-users", getUsers);
router.post("/auth/get-tv-users", getTvUsers);
router.post("/auth/delete", deleteUser);

// Agenda
router.post("/agenda/create", createAgenda);
router.get("/agenda/all", getAgendas);
router.get("/agenda", getAgendaById);
router.post("/agenda/delete", deleteAgenda);
router.get("/pdf", getAgendaPdf);
router.get("/pdf-blob", getAgendaPdfBlob);

// Vote
router.post("/vote/start", startVote);
router.post("/vote/handle", handleVote);
router.post("/vote/close", closeVote);
router.post("/vote/reset", resetVote);

// Sessions (Sjednice)
// <-- 2. DODAJ NOVE RUTE OVDJE
router.get("/get_session_or_latest", getLatestSessionOrActive);
router.get("/sessions_by_year", getSessionsByYear);

export default router;
