const express = require("express")
const router = express.Router()

const { catchSpecialChars } = require("./middleware/middleware")

const { CreateTask, GetTaskbyState, PromoteTask2Done } = require("./controller")

router.use(catchSpecialChars)

router.route("/CreateTask").post(CreateTask)
router.route("/GetTaskbyState").post(GetTaskbyState)
router.route("/PromoteTask2Done").post(PromoteTask2Done)

module.exports = router
