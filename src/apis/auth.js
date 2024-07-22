require("dotenv").config();

const { Request, Response, NextFunction } = require("express");
const { OAuth2Client } = require("google-auth-library");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { LoginObject } = require("../interfaces/global");
const controllers = require("../controllers");
const Users = require("../models/users");
const Sessions = require("../models/session");
const Agenda = require("../models/agenda");
const mongoose = require("mongoose");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email.trim() && password.trim())) {
      return res.status(400).send("Please Enter All Required Data.");
    }

    const user = await controllers.Auth.findOne({
      filter: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(404).send("User Not Exist. Please Register");
    }

    if (password == user.password) {
      const token = jwt.sign(
        { user_id: user._id, email: email.toLowerCase().trim() },
        String("abc"),
        {
          expiresIn: "2h",
        }
      );

      res.status(200).json({
        success: true,
        id: user._id,
        role: user.role,
        token: token,
        name: user.name,
      });
    } else {
      return res.status(400).send("Password or Username Is Not Correct");
    }
  } catch (err) {
    console.log("login error: ", err);
    res.status(500).send(err.message);
  }
};

const middleware = async (req, res, next) => {
  try {
    const token = req.headers["authorization"] || "";
    console.log(token);

    jwt.verify(token, String(process.env.TOKEN_KEY), async (err, userData) => {
      if (err) return res.status(403).end();

      const user = await controllers.Auth.findOne({
        filter: {
          email: userData.email,
        },
      });
      req.user = user;

      next();
    });
  } catch (err) {
    console.log(err.message);
    res.status(401).end();
  }
};

const get_users = async (req, res, next) => {
  try {
    const { id } = req.body;
    const users = await controllers.Auth.fintByCity(id);
    res.status(200).json({ data: users });
  } catch (err) {
    console.log(err.message);
    res.status(401).end();
  }
};
const get_tv_users = async (req, res, next) => {
  try {
    // const { id } = req.body;
    const users = await controllers.Auth.findAll();
    res.status(200).json({ data: users });
  } catch (err) {
    console.log(err.message);
    res.status(401).end();
  }
};

// -------------------------------------------------
// All users list
// -------------------------------------------------

const users_list = async (req, res) => {
  try {
    const { page = 1, itemsPerPage = 10, search = "", sort = "" } = req.query;

    const pageNumber = parseInt(page, 10);
    const itemsPerPageNumber = parseInt(itemsPerPage, 10);

    const query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const sortQuery = {};
    if (sort) {
      sortQuery[sort] =  1;
    } else {
      sortQuery['createdAt'] = -1;
    }

    const totalItems = await Users.countDocuments(query);
    const users = await Users.find(query)
      .sort(sortQuery)
      .skip((pageNumber - 1) * itemsPerPageNumber)
      .limit(itemsPerPageNumber);

    res.status(200).json({
      data: users,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / itemsPerPageNumber),
      currentPage: pageNumber,
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// -------------------------------------------------
// All sessions list
// -------------------------------------------------

const sessions_list = async (req, res ) => {
  try {
    const { page = 1, itemsPerPage = 10, search = "",sort ="" } = req.query;

    const pageNumber = parseInt(page, 10);
    const itemsPerPageNumber = parseInt(itemsPerPage, 10);

    const query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const totalItems = await Sessions.countDocuments(query);

    const sortQuery = {};
    if (sort) {
      sortQuery[sort] =  1;
    } else {
      sortQuery['createdAt'] = -1;
    }

    const users = await Sessions.find(query)
      // .sort(sortQuery)
      .skip((pageNumber - 1) * itemsPerPageNumber)
      .limit(itemsPerPageNumber);

    res.status(200).json({
      data: users,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / itemsPerPageNumber),
      currentPage: pageNumber,
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// -------------------------------------------------
// All agendas list
// -------------------------------------------------

const agendas_list = async (req, res ) => {
  try {
    const { page = 1, itemsPerPage = 10, search = "", sort } = req.query;

    const pageNumber = parseInt(page, 10);
    const itemsPerPageNumber = parseInt(itemsPerPage, 10);

    const query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const totalItems = await Agenda.countDocuments(query);

    const sortQuery = {};
    if (sort) {
      sortQuery[sort] =  1;
    } else {
      sortQuery['createdAt'] = -1;
    }

    const users = await Agenda.find(query).populate('voters.user')
      // .sort(sortQuery)
      .skip((pageNumber - 1) * itemsPerPageNumber)
      .limit(itemsPerPageNumber);

    res.status(200).json({
      data: users,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / itemsPerPageNumber),
      currentPage: pageNumber,
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const delete_user = async (req, res, next) => {
  try {
    const user_id = req.params.id;
    if (!user_id) {
      res.status(400).json({ error: "user_id parameter is missing" });
      return;
    }
    const filter = { _id: user_id };

    const result = await controllers.Auth.delete({ filter });

    if (result.deletedCount === 0) {
      res.status(404).json({ error: "User item not found" });
      return;
    }

    res.status(200).json({ status: 1, message: "User deleted successfully" });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, city, role, party } = req.body;

    
    const user = await Users.create({
      name: name,
      email: email,
      password: password,
      city: city,
      role: role,
      party: party,
    });

    res.status(200).json({ status: 1, data: user });
  } catch (error) {
    console.error("Error processing file upload:", error);
    res.status(500).json({ error: "Error processing file upload" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email, password, city, role, party } = req.body;
    const { id } = req.query;

    const user = await controllers.Auth.update({
      name: name,
      email: email,
      password: password,
      city: city,
      role: role,
      party: party,
      id: id,
    });

    res.status(200).json({ status: 1, data: user });
  } catch (error) {
    console.error("Error processing file upload:", error);
    res.status(500).json({ error: "Error processing file upload" });
  }
};

module.exports = {
  createUser,
  login,
  middleware,
  get_users,
  get_tv_users,
  delete_user,
  updateUser,
  users_list,
  sessions_list,
  agendas_list,
};
