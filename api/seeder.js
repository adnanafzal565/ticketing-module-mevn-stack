// database module
const mongodb = require("mongodb")

// client used to connect with database
const MongoClient = mongodb.MongoClient

const bcryptjs = require("bcryptjs")

// connect with database
MongoClient.connect("mongodb://localhost:27017", async function (error, client) {
    if (error) {
        console.error(error)
        return
    }

    // database name
    const db = client.db("ticketing_module")
    console.log("Database connected.")

    const salt = bcryptjs.genSaltSync(10)
    const hash = bcryptjs.hashSync("admin", salt)

    // insert in database
    await db.collection("users").updateOne({
    	email: "representative@adnan-tech.com",
    }, {
    	$setOnInsert: {
	        name: "Representative",
	        email: "representative@adnan-tech.com",
	        password: hash,
	        accessToken: "",
	        role: "representative", // user, representative
	        createdAt: new Date().getTime()
	    }
	}, {
    	upsert: true
    })

    console.log("Seeding done.")
})