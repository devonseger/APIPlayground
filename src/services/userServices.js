import fs from "fs";
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"

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

  async updateUser(id, updateData) {
    try {
      const users = this._readDb();
      // find the index of user
      const userIndex = users.findIndex(u => u.id === id)

      if (userIndex === -1) {
        throw new Error("User not found!")
      }
      // if updating password then we need to hash it
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password)
      }
      
      // select the user at index
      users[userIndex] = {
        // spread the user data
        ...users[userIndex],
        // spread the updated data
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      this._writeDb(users);

      // return the user without password

      const {password, ...safeUser } = users[userIndex];
      return { success: true, user: safeUser}
  
    } catch (error) {
      console.error("Error updating user:", error)    
    }
  }

  async authorize(user, pass) {
    try {
      const users = await this._readDb()
      const foundUser = users.find((u) => u.user === user)
      console.log('testing foundUser', foundUser)
      if (!foundUser) {
        return {success: false, message: 'Incorrect username or password.'}
      }
      const validPass = bcrypt.compare(pass, foundUser.password)

      if (!validPass) {
        return {success: false, message: 'Incorrect username or password.'}
      }

      if (foundUser && validPass) {
        // Generate JWT & Refresh token, store hashed refresh tokens with user.
        const token = jwt.sign({ user: foundUser }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '15m'})
        const refreshToken = crypto.randomBytes(64).toString('hex')
        const hashedRefresh = await bcrypt.hash(refreshToken, this.saltRounds)

        // Store 
        await this.updateUser(foundUser.id, {refresh: hashedRefresh, jwt: token})
        return {success: true, message: 'Authorized', token, refreshToken}
      }
  
    } catch(err) {
      console.error('Error authorizing user:', err)
      }
  }

  async refresh(id, refreshToken) {
    

  }
}