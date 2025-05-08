const bcrypt = require("bcryptjs");

if (process.argv[2]) {
  const password = bcrypt.hashSync(process.argv[2], 10);
  console.log(`Crypted password for ${process.argv[2]}:`, password, "\n");
} else {
  console.error("Password missing!", "\n");
  console.log("Syntax:");
  console.log("npm run password <password>", "\n");
}
