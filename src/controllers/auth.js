const { UserSchema } = require("../models");

const Auth = {
  create: async (props) => {
    const { name, email, password, role, city, party } = props;
    try {

      const user = await UserSchema.findOne({ email });

      if(user) {
        const error = new Error('Email already exists! Please use another!');
        error.statusCode = 400;
        throw error;
      }

      const newData = new UserSchema({
        name: name,
        email: email,
        password: password,
        role: role,
        city: city,
        party: party,
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
  findOne: async (props) => {
    const { filter } = props;

    try {
      const result = await UserSchema.findOne(filter);

      return result;
    } catch (err) {
      throw new Error(err.message);
    }
  },
  fintByCity: async (props) => {
    const { param } = props;
    try {
      const user = await UserSchema.findOne(param);
      const result = await UserSchema.find({ city: user.city });

      return result;
    } catch (err) {
      throw new Error(err.message);
    }
  },
  findAll: async () => {
    try {
      const result = await UserSchema.find();

      return result;
    } catch (err) {
      throw new Error(err.message);
    }
  },

  authenticateUser: async (props) => {
    const { email, password } = props;
    function isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }
    if (!isValidEmail(email)) {
      throw new Error("Invalid email format");
    }

    try {
      const result = await UserSchema.findOne({ email, password });

      return result;
    } catch (err) {
      throw new Error(err.message);
    }
  },

  delete: async (props) => {
    const { filter } = props;
    try {
      const result = await UserSchema.deleteOne(filter);
      return result;
    } catch (err) {
      throw new Error(err.message);
    }
  },

  update: async (props) => {
    const { name, email, password, role, city, party, id } = props;
    console.log('user id (update): ', id);
    try {
      const user = await UserSchema.findOne({ _id: id });

      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404
        throw error;
      }

      user.name = name || user.name;
      user.email = email || user.email;
      user.password = password || user.password;
      user.role = role || user.role;
      user.city = city || user.city;
      user.party = party || user.party;

      const updatedUser = await user.save();
      return updatedUser;
    } catch (err) {
      throw new Error(err.message);
    }
  },
};

module.exports = Auth;
