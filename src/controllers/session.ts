import { Request, Response } from "express";
import Session from "../models/session";
import Agenda from "../models/agenda";
import Users from "../models/users";

/**
 * Dohvaća ili najnoviju sjednicu ili trenutno aktivnu sjednicu.
 * Frontend ovo koristi za učitavanje glavne stranice.
 */
export const getLatestSessionOrActive = async (
  req: Request,
  res: Response
) => {
  try {
    let session = await Session.findOne({ isActive: true })
      .populate("agendas")
      .populate("users");

    if (!session) {
      session = await Session.findOne()
        .sort({ date: -1 }) // Sortiraj po datumu silazno (najnovija prva)
        .populate("agendas")
        .populate("users");
    }

    if (!session) {
      return res.status(404).json({ message: "Nije pronađena nijedna sjednica." });
    }

    return res.status(200).json(session);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Dohvaća sve sjednice grupirane po godini.
 * Frontend ovo koristi za prikaz arhive sjednica.
 */
export const getSessionsByYear = async (req: Request, res: Response) => {
  try {
    const sessionsByYear = await Session.aggregate([
      {
        $project: {
          year: { $year: "$date" },
          name: 1,
          date: 1,
          isActive: 1,
        },
      },
      {
        $group: {
          _id: "$year",
          sessions: {
            $push: {
              _id: "$_id",
              name: "$name",
              date: "$date",
              isActive: "$isActive",
            },
          },
        },
      },
      {
        $sort: { _id: -1 }, // Sortiraj po godini silazno (najnovija prva)
      },
    ]);

    if (!sessionsByYear || sessionsByYear.length === 0) {
      return res
        .status(404)
        .json({ message: "Nisu pronađene sjednice za grupiranje." });
    }

    return res.status(200).json(sessionsByYear);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
