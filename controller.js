const connection = require("./config/database")
const bcrypt = require("bcryptjs")

//Setting up database connection
const mysql = require("mysql2")

const connectDatabase = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})
if (connectDatabase) console.log(`MySQL Database connected with host: ${process.env.DB_HOST}`)

//Create Task => /createTask
exports.CreateTask = async (req, res, next) => {
  const { username, password, Task_name, Task_app_Acronym } = req.body
  let { Task_description } = req.body
  try {
    if (username === undefined || password === undefined || Task_name === undefined || Task_app_Acronym === undefined) {
      res.json({
        code: "PS001"
      })
      return
    }

    if (typeof username !== "string" || typeof password !== "string" || typeof Task_name !== "string" || typeof Task_app_Acronym !== "string") {
      res.json({
        code: "PS002"
      })
      return
    }

    const user = await validateUser(username, password, connection)
    if (!user) {
      res.json({
        code: "IM001"
      })
      return
    }

    if (user.is_disabled === 1) {
      res.json({
        code: "IM002"
      })
      return
    }

    const [row, fields] = await connection.promise().query("SELECT * FROM application WHERE App_Acronym = ?", [Task_app_Acronym])
    if (row.length === 0) {
      res.json({
        code: "AM001"
      })
      return
    }

    const permit = row[0].App_permit_create
    if (permit === null || permit === undefined) {
      res.json({
        code: "AM002"
      })
      return
    }

    const user_group = user.grouplist.slice(1, -1).split(",")
    const authorised = user_group.includes(permit)
    if (!authorised) {
      res.json({
        code: "AM002"
      })
      return
    }

    if (!Task_description) {
      Task_description = null
    }

    const Task_notes = user.username + " created " + Task_name + " on " + new Date().toISOString().slice(0, 10)
    let Task_id = Task_app_Acronym + row[0].app_Rnumber
    const Task_state = "Open"
    const Task_plan = null
    const Task_creator = user.username
    const Task_owner = user.username

    const response = await connection.promise().query("INSERT INTO task (Task_name, Task_description, Task_notes, Task_id, Task_plan, Task_app_acronym, Task_state, Task_creator, Task_owner, Task_createDate) VALUES (?,?,?,?,?,?,?,?,?,?)", [Task_name, Task_description, Task_notes, Task_id, Task_plan, Task_app_Acronym, Task_state, Task_creator, Task_owner, new Date().toISOString().slice(0, 10)])
    if (response[0].affectedRows === 0) {
      res.json({
        code: "T003"
      })
      return
    }

    const newApp_Rnumber = row[0].App_Rnumber + 1
    const response2 = await connection.promise().query("UPDATE application SET App_Rnumber = ? WHERE App_Acronym = ?", [newApp_Rnumber, Task_app_Acronym])
    if (response2.affectedRows === 0) {
      res.json({
        code: "T003"
      })
      return
    }

    res.json({
      code: "S001"
    })
  } catch (e) {
    res.json({
      code: "T003"
    })
  }
}

//GetTaskbyState => /GetTaskbyState
exports.GetTaskbyState = async (req, res, next) => {
  const { username, password, Task_state, Task_app_Acronym } = req.body
  try {
    if (username === undefined || password === undefined || Task_state === undefined || Task_app_Acronym === undefined) {
      res.json({
        code: "PS001"
      })
      return
    }

    if (typeof username !== "string" || typeof password !== "string" || typeof Task_state !== "string" || typeof Task_app_Acronym !== "string") {
      res.json({
        code: "PS002"
      })
      return
    }

    const user = await validateUser(username, password, connection)
    if (!user) {
      res.json({
        code: "IM001"
      })
      return
    }

    if (user.is_disabled === 1) {
      res.json({
        code: "IM002"
      })
      return
    }

    const [row, fields] = await connection.promise().query("SELECT * FROM application WHERE App_Acronym = ?", [Task_app_Acronym])
    if (row.length === 0) {
      res.json({
        code: "AM001"
      })
      return
    }

    const [row1, fields1] = await connection.promise().query("SELECT * FROM task WHERE Task_state = ? AND Task_app_Acronym = ?", [Task_state, Task_app_Acronym])
    if (row1.length === 0) {
      res.json({
        code: "T002"
      })
      return
    }

    res.json({
      code: "S001",
      data: row1
    })
  } catch (e) {
    res.json({
      code: "T003333"
    })
  }
}

exports.PromoteTask2Done = async (req, res, next) => {
  const { username, password, Task_id, Task_app_Acronym } = req.body
  let { New_notes } = req.body
  try {
    if (username === undefined || password === undefined || Task_id === undefined || Task_app_Acronym === undefined) {
      res.json({
        code: "PS001"
      })
      return
    }

    if (typeof username !== "string" || typeof password !== "string" || typeof Task_id !== "string" || typeof Task_app_Acronym !== "string") {
      res.json({
        code: "PS002"
      })
      return
    }

    const user = await validateUser(username, password, connection)
    if (!user) {
      res.json({
        code: "IM001"
      })
      return
    }

    if (user.is_disabled === 1) {
      res.json({
        code: "IM002"
      })
      return
    }

    const [row, fields] = await connection.promise().query("SELECT * FROM application WHERE App_Acronym = ?", [Task_app_Acronym])
    if (row.length === 0) {
      res.json({
        code: "AM001"
      })
      return
    }

    const permit = row[0].App_permit_Doing
    if (permit === null || permit === undefined) {
      res.json({
        code: "AM002"
      })
      return
    }

    const user_group = user.grouplist.slice(1, -1).split(",")
    const authorised = user_group.includes(permit)
    if (!authorised) {
      res.json({
        code: "AM002"
      })
      return
    }

    const [row1, fields1] = await connection.promise().query("SELECT * FROM task WHERE Task_id = ? AND Task_app_Acronym = ?", [Task_id, Task_app_Acronym])
    if (row1.length === 0) {
      res.json({
        code: "T001"
      })
      return
    }

    const [row2, fields2] = await connection.promise().query("SELECT * FROM task WHERE Task_state = ? AND Task_app_Acronym = ?", ["Doing", Task_app_Acronym])
    if (row2.length === 0) {
      res.json({
        code: "T002"
      })
      return
    }

    const Task_owner = user.username

    if (New_notes === undefined) {
      New_notes = +Task_owner + " moved " + row1[0].Task_name + " from Doing to Done on " + new Date().toISOString().slice(0, 10) + "\n"
    } else {
      New_notes = New_notes + "\n" + Task_owner + " moved " + row1[0].Task_name + " from Doing to Done on " + new Date().toISOString().slice(0, 10) + "\n"
    }

    const Task_notes = New_notes + "\n" + row1[0].Task_notes
    const response = await connection.promise().query("UPDATE task SET Task_notes = ?, Task_state = ?, Task_owner = ? WHERE Task_id = ?", [Task_notes, "Done", Task_owner, Task_id])
    if (response[0].affectedRows === 0) {
      res.json({
        code: "T003"
      })
      return
    }

    res.json({
      code: "S001"
    })
  } catch (e) {
    console.log(e)
    res.json({
      code: "T003"
    })
  }
}

const validateUser = async (username, password, connection) => {
  const [row, fields] = await connection.promise().query("SELECT * FROM user WHERE username = ?", [username])
  if (row.length === 0) {
    return
  }
  //we need to hash the password and compare it with the hashed password in the database
  const isPasswordMatched = await bcrypt.compare(password, row[0].password)
  if (!isPasswordMatched) {
    return
  }

  return row[0]
}
