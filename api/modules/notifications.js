const express = require("express")
const auth = require("./auth")
const ObjectId = require("mongodb").ObjectId

module.exports = {
	init: function (app) {
		const router = express.Router()

		router.post("/markAllAsRead", auth, async function (request, result) {
			const user = request.user

			await global.db.collection("notifications").updateMany({
		    	"user._id": user._id
		    }, {
		    	$set: {
		    		isRead: true
		    	}
		    })

			result.json({
	    		status: "success",
	    		message: "All notifications has been marked as read."
	    	})
		})

		router.post("/fetch", auth, async function (request, result) {
			const user = request.user
			const _id = request.fields._id

			const notification = await global.db.collection("notifications").findOne({
		    	$and: [{
		    		_id: ObjectId(_id)
		    	}, {
			    	"user._id": user._id
			    }]
		    })

		    if (notification == null) {
		    	result.json({
		    		status: "error",
		    		message: "Notification not found."
		    	})

		    	return
		    }

		    await global.db.collection("notifications").findOneAndUpdate({
		    	_id: notification._id
		    }, {
		    	$set: {
		    		isRead: true
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

		    result.json({
	    		status: "success",
	    		message: "Data has been fetched.",
	    		notification: notification,
	    		unreadNotifications: unreadNotifications
	    	})
		})

		router.post("/", auth, async function (request, result) {
            const user = request.user

            const searchObj = {
                "user._id": user._id
            }

            // number of records you want to show per page
            const perPage = 30

            // total number of records from database
            const total = await global.db.collection("tickets").countDocuments(searchObj)

            // get current page number
            const pageNumber = request.fields.page ?? 1

            // calculating number of pagination links required
            const pages = Math.ceil(total / perPage)

            // get records to skip
            const startFrom = (pageNumber - 1) * perPage

            const notifications = await global.db.collection("notifications").find(searchObj)
                .sort({ createdAt: -1 })
                .skip(startFrom)
                .limit(perPage)
                .toArray()

            result.json({
                status: "success",
                message: "Data has been fetched.",
                notifications: notifications,
                pages: pages,
                pageNumber: parseInt(pageNumber)
            })
        })

		app.use("/notifications", router)
	}
}