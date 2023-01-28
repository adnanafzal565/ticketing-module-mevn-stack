// include express framework
const express = require("express")

// create an instance of it
const app = express()

// create http server from express instance
const http = require("http").createServer(app)

// database module
const mongodb = require("mongodb")

// client used to connect with database
const MongoClient = mongodb.MongoClient

// module required for parsing FormData values
const expressFormidable = require("express-formidable")

// setting the middleware
app.use(expressFormidable({
    multiples: true, // request.files to be arrays of files
}))

const fileSystem = require("fs")
// app.use("/uploads", express.static(__dirname + "/uploads"))

// sockets are used for realtime communication
global.socketIO = require("socket.io")(http, {
    cors: {
        origin: ["http://localhost:8080"]
    }
})
global.users = []

const bcryptjs = require("bcryptjs")

// JWT used for authentication
const jwt = require("jsonwebtoken")

// secret JWT key
global.jwtSecret = "jwtSecret1234567890"

const auth = require("./modules/auth")
const tickets = require("./modules/tickets")
const notifications = require("./modules/notifications")

// Add headers before the routes are defined
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader("Access-Control-Allow-Origin", "*")

    // Request methods you wish to allow
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE")

    // Request headers you wish to allow
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type,Authorization")

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader("Access-Control-Allow-Credentials", true)

    // Pass to next layer of middleware
    next()
})

const port = (process.env.PORT || 3000)

// start the server at port 3000 (for local) or for hosting server port
http.listen(port, function () {
    console.log("Server has been started at: " + port)

    // connect with database
    MongoClient.connect("mongodb://localhost:27017", function (error, client) {
        if (error) {
            console.error(error)
            return
        }

        // database name
        db = client.db("ticketing_module")
        global.db = db
        console.log("Database connected")

        tickets.init(app)
        notifications.init(app)

        global.socketIO.on("connection", function (socket) {
            // console.log("Socket: " + socket.id)

            socket.on("connected", function (_id) {
                global.users[_id.toString()] = socket.id
            })
        })

        // route for logout request
        app.post("/logout", auth, async function (request, result) {
            const user = request.user

            // update JWT of user in database
            await db.collection("users").findOneAndUpdate({
                _id: user._id
            }, {
                $set: {
                    accessToken: ""
                }
            })

            result.json({
                status: "success",
                message: "Logout successfully."
            })
        })

        app.post("/getUser", auth, async function (request, result) {
            const user = request.user

            const notificationsQuery = {
                $and: [{
                    "user._id": user._id
                }, {
                    isRead: false
                }]
            }

            const unreadNotifications = await db.collection("notifications").countDocuments(notificationsQuery)

            const notifications = await db.collection("notifications").find({
                "user._id": user._id
            })
                .sort({ isRead: 1 })
                .limit(3)
                .toArray()

            let searchObj = {
                "createdBy._id": user._id
            }

            if (user.role == "representative") {
                searchObj = {}
            }

            const tickets = await db.collection("tickets").find(searchObj).toArray()

            result.json({
                status: "success",
                message: "Data has been fetched.",
                user: user,
                unreadNotifications: unreadNotifications,
                notifications: notifications,
                tickets: tickets
            })
        })

        // route for login requests
        app.post("/login", async function (request, result) {

            // get values from login form
            const email = request.fields.email ?? ""
            const password = request.fields.password ?? ""

            if (email == "" || password == "") {
                result.json({
                    status: "error",
                    message: "Please enter all values."
                })
                return
            }

            // check if email exists
            const user = await db.collection("users").findOne({
                email: email
            })

            if (user == null) {
                result.json({
                    status: "error",
                    message: "Email does not exists."
                })
                return
            }

            // check if password is correct
            const isVerify = bcryptjs.compareSync(password, user.password)

            if (isVerify) {

                // generate JWT of user
                const accessToken = jwt.sign({
                    userId: user._id.toString()
                }, jwtSecret)

                // update JWT of user in database
                await db.collection("users").findOneAndUpdate({
                    email: email
                }, {
                    $set: {
                        accessToken: accessToken
                    }
                })

                const notificationsQuery = {
                    $and: [{
                        "user._id": user._id
                    }, {
                        isRead: false
                    }]
                }

                const unreadNotifications = await db.collection("notifications").countDocuments(notificationsQuery)

                const notifications = await db.collection("notifications").find({
                    "user._id": user._id
                })
                    .sort({ isRead: 1 })
                    .limit(3)
                    .toArray()

                result.json({
                    status: "success",
                    message: "Login successfully.",
                    accessToken: accessToken,
                    user: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    },
                    unreadNotifications: unreadNotifications,
                    notifications: notifications
                })

                return
            }

            result.json({
                status: "error",
                message: "Password is not correct."
            })
        })

        app.post("/registration", async function (request, result) {
            const name = request.fields.name ?? ""
            const email = request.fields.email ?? ""
            const password = request.fields.password ?? ""
            const createdAt = new Date().getTime()

            if (name == "" || email == "" || password == "") {
                result.json({
                    status: "error",
                    message: "Please enter all values."
                })
                return
            }

            // check if email already exists
            const user = await db.collection("users").findOne({
                email: email
            })

            if (user != null) {
                result.json({
                    status: "error",
                    message: "Email already exists."
                })
                return
            }

            const salt = bcryptjs.genSaltSync(10)
            const hash = bcryptjs.hashSync(password, salt)

            // insert in database
            await db.collection("users").insertOne({
                name: name,
                email: email,
                password: hash,
                accessToken: "",
                role: "user", // user, representative
                createdAt: createdAt
            })

            result.json({
                status: "success",
                message: "Account has been created. Please login now."
            })
        })
    })
})