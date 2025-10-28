import express from "express";
import { UserService } from "../services/userServices.js";

const route = express.Router();

route
  .get("/", async (req, res) => {
    let users = await new UserService().getAllUsers()
    res.json(users)
  })
  .get("/:id", async (req, res) => {
    const userId = req.params.id
    console.log(`searching for user with id of ${userId}`)
    let user = await new UserService().getUserById(userId)
    res.json(user)
  })
  .post("/", async (req, res) => {
    const data = req.body
    await new UserService().createUser(data)    
    res.json('User created successfully')
  })
  .patch("/", async (req, res) => {
    console.log("User put route");
  })
  .delete("/:id", async (req, res) => {
    const m = await new UserService().deleteUser(req.params.id)
    res.json(m)
    console.log("User delete route");
  });

export default route;
