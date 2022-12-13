const connection = require("./db-config");
const express = require("express");
const app = express();
const userHandlers = require("./userHandlers");
const { hashPassword, verifyPassword, verifyToken } = require("./auth.js");
const argon2 = require("argon2");

const port = process.env.PORT ?? 5001;

connection.connect((err) => {
  if (err) {
    console.error("error connecting: " + err.stack);
  } else {
    console.log("connected as id " + connection.threadId);
  }
});

app.use(express.json());

app.get("/api/movies", (req, res) => {
  let sql = "SELECT * FROM movies";
  const sqlValues = [];

  if (req.query.color) {
    sql += " WHERE color = ?";
    sqlValues.push(req.query.color);
  }

  if (req.query.max_duration) {
    if (req.query.color) {
      sql += " AND duration <= ? ;";
    } else {
      sql += " WHERE duration <= ?";
    }

    sqlValues.push(req.query.max_duration);
  }

  connection.query(sql, sqlValues, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error retrieving movies from database");
    } else {
      res.json(result);
    }
  });
});

app.get("/api/movies/:id", (req, res) => {
  const movieId = req.params.id;
  connection.query(
    "SELECT * FROM movies WHERE id = ?",
    [movieId],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error retrieving movie from database");
      } else if (result.length === 0) {
        res.status(404).send("Movie not found");
      } else {
        res.json(result[0]);
      }
    }
  );
});

app.get("/api/users", (req, res) => {
  let sql = "SELECT * FROM users";
  const sqlValues = [];

  if (req.query.language) {
    sql += " WHERE language = ?";
    sqlValues.push(req.query.language);
  }

  connection.query(sql, sqlValues, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error retrieving users from database");
    } else {
      res.json(result);
    }
  });
});

app.get("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  connection.query(
    "SELECT firstname,lastname,email,city,language FROM users WHERE id = ?",
    [userId],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error retrieving user from database");
      } else if (result.length === 0) {
        res.status(404).send("User not found");
      } else {
        res.json(result[0]);
      }
    }
  );
});

app.post("/api/users", hashPassword, (req, res) => {
  const { firstname, lastname, email, hashedPassword } = req.body;
  connection.query(
    "INSERT INTO users (firstname, lastname, email, hashedPassword) VALUES (?, ?, ?, ?)",
    [firstname, lastname, email, hashedPassword],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error saving the user");
      } else {
        res.status(200).send("User successfully saved");
      }
    }
  );
});

app.post(
  "/api/login",
  userHandlers.getUserByEmailWithPasswordAndPassToNext,
  verifyPassword
);

app.use(verifyToken);

app.post("/api/movies", verifyToken, (req, res) => {
  const { title, director, year, color, duration } = req.body;
  connection.query(
    "INSERT INTO movies (title, director, year, color, duration) VALUES (?, ?, ?, ?, ?)",
    [title, director, year, color, duration],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error saving the movie");
      } else {
        res.status(200).send("Movie successfully saved");
      }
    }
  );
});

app.put("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  const userPropsToUpdate = req.body;
  connection.query(
    "UPDATE users SET ? WHERE id = ?",
    [userPropsToUpdate, userId],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error updating a user");
      } else {
        res.status(200).send("User updated successfully 🎉");
      }
    }
  );
});

app.put("/api/movies/:id", (req, res) => {
  const movieId = req.params.id;
  const moviePropsToUpdate = req.body;
  connection.query(
    "UPDATE movies SET ? WHERE id = ?",
    [moviePropsToUpdate, movieId],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error updating a movie");
      } else {
        res.status(200).send("Movie updated successfully 🎉");
      }
    }
  );
});

app.delete("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  connection.query(
    "DELETE FROM users WHERE id = ?",
    [userId],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error deleting an user");
      } else {
        res.sendStatus(204);
      }
    }
  );
});

app.delete("/api/movies/:id", (req, res) => {
  const movieId = req.params.id;
  connection.query(
    "DELETE FROM movies WHERE id = ?",
    [movieId],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error deleting a movie");
      } else {
        res.sendStatus(204);
      }
    }
  );
});

app.listen(port, (err) => {
  if (err) {
    console.error("Something bad happened");
  } else {
    console.log(`Server is listening on ${port}`);
  }
});
