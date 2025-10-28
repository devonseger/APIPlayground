import fs from "fs";
import crypto from "crypto";
import bcrypt from "bcrypt";

export class UserService {
  constructor() {
    // initialize instance if needed
    this.users = [];
    this.dbPath = "./src/db/users.json";
    this.saltRounds = 10;
  }

  _readDb() {
  try {
    if (!fs.existsSync(this.dbPath)) return [];
    const raw = fs.readFileSync(this.dbPath, 'utf8');
    const json = JSON.parse(raw);
    
    return Array.isArray(json) ? json : (Array.isArray(json.users) ? json.users : []);
  } catch (err) {
    console.error("Error reading database:", err);
    return [];
  }
}

  _writeDb(data) {
    try {
      if (!data) {
        throw new Error("No data provided.");
      }
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error("Error writing data to db:", err);
    }
  }

  async getAllUsers() {
    try {
        const users = this._readDb()
        console.log(users)
        // Destructure password from the rest of the data. password = password rest = {user, id}
        const safeUsers = users.map(({ password, ...rest }) => rest)
        console.log(safeUsers)
        return safeUsers
    } catch(err) {
        console.error(err)
    }
  }

  async getUserById(id) {
    try {
        const users = this._readDb()
        const safeUsers = users.map(({ password, ...rest }) => rest)
        for (const user of safeUsers) {
            if (id === user.id) {
                return user
            }
        }
    } catch (error) {
        console.log("Error fetching user:", error)
    }
  }

  async createUser(user) {
    try {
        const db = this._readDb() || { users: [] }
        if (user.user && user.password) {
            const hashedPassword = await bcrypt.hash(user.password, this.saltRounds)
            const newUser = { ...user, password: hashedPassword, id: crypto.randomUUID() }
            console.log(db)
            for (const user of db) {
                if (user.user === newUser.user) {
                    throw new Error("This user already exists.")
                }
            }

            db.push(newUser)
            this._writeDb(db)
        }
    else {
        throw new Error("Missing required information!")
    }

    } catch(err) {
        console.error("Error creating user:", err)
        throw err
    }
  }

  async deleteUser(id) {
    try {
        const users = this._readDb()
        const updatedUsers = users.filter(user => user.id !== id)
        this._writeDb(updatedUsers)
        return {success: true, message: `User ${id} deleted.`}
    } catch (error) {
        console.error("Error deleting user:", error)
        return {success: false, error: error.message}
    }
  }
}