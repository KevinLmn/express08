const connection = require("./db-config");
const getUserByEmailWithPasswordAndPassToNext = (req, res, next) => {
  const { email } = req.body;

  connection
    .promise()
    .query("select * from users where email = ?", [email])
    .then(([users]) => {
      if (users[0] != null) {
        req.user = users[0];
        next();
      } else {
        res.status(401).send("No user with this email!");
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error retrieving data from database");
    });
};

module.exports = { getUserByEmailWithPasswordAndPassToNext };
