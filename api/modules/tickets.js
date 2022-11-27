const express = require("express")
const auth = require("./auth")

const fileSystem = require("fs")
const ObjectId = require("mongodb").ObjectId

module.exports = {
	init: function (app) {
		const self = this
		const router = express.Router()

		router.post("/close", auth, async function (request, result) {
			const user = request.user
			const _id = request.fields._id

			const ticket = await global.db.collection("tickets").findOne({
				_id: ObjectId(_id)
			})

		    if (ticket == null) {
		    	result.json({
		    		status: "error",
		    		message: "Ticket not found."
		    	})

		    	return
		    }

		    if (user.role != "representative") {
		    	result.json({
		    		status: "error",
		    		message: "Unauthorized."
		    	})

		    	return
		    }

		    const closedBy = {
				_id: user._id,
				name: user.name,
				email: user.email
			}

		    await global.db.collection("tickets").findOneAndUpdate({
				_id: ticket._id
			}, {
				$set: {
					status: "Closed",
					closedBy: closedBy,
					updatedAt: new Date().getTime()
				}
			})

		    result.json({
	    		status: "success",
	    		message: "Ticket has been closed.",
	    		ticketStatus: "Closed",
	    		closedBy: closedBy
	    	})
		})

		router.post("/reply", auth, async function (request, result) {
			const user = request.user
			const _id = request.fields._id
			const message = request.fields.message ?? ""

			if (!message) {
		    	result.json({
		    		status: "error",
		    		message: "Please enter all values."
		    	})

		    	return
		    }

		    let searchObj = {
		    	"createdBy._id": user._id
		    }

		    if (user.role == "representative") {
		    	searchObj = {}
		    }

			const ticket = await global.db.collection("tickets").findOne({
				$and: [{
		    		_id: ObjectId(_id)
		    	}, searchObj]
			})

		    if (ticket == null) {
		    	result.json({
		    		status: "error",
		    		message: "Ticket not found."
		    	})

		    	return
		    }

		    if (ticket.status == "Closed") {
				result.json({
					status: "error",
					message: "Sorry, the ticket is now closed."
				})

				return
			}

		    const files = []
		    if (Array.isArray(request.files.files)) {
		        for (let a = 0; a < request.files.files.length; a++) {
		        	files.push(request.files.files[a])
		        }
		    } else {
		        files.push(request.files.files)
		    }

		    self.callbackFileUpload(files, 0, [], async function (savedPaths) {
		        const replyObj = {
					_id: ObjectId(),
					message: message,
					attachments: savedPaths,
					by: {
						_id: user._id,
						name: user.name,
						role: user.role
					},
					createdAt: new Date().getTime()
				}

				let status = ""
				if (user.role == "representative") {
					status = "Answered"
				} else {
					status = "Waiting reply"
				}

				await global.db.collection("tickets").findOneAndUpdate({
					_id: ticket._id
				}, {
					$push: {
						replies: replyObj
					},

					$set: {
						status: status,
						updatedAt: new Date().getTime()
					}
				})

				let userObj = null

				if (user.role == "user") {
					// get last representative who replied on this ticket
					// if there isn't any representative, then send notification to all representatives
					// otherwise, send the notification to the last representative who replied on this ticket

					ticket.replies = ticket.replies.reverse()

					const reps = []
					ticket.replies.forEach(function (reply) {
						const userRole = reply.by.role || "user"
						if (userRole == "representative") {
							const by = reply.by._id.toString()
							let flag = false
							reps.forEach(function (rep) {
								if (rep._id.toString() == by) {
									flag = true
								}
							})
							if (!flag) {
								reps.push(reply.by)
							}
						}
					})

					reps.forEach(async function (rep) {
						const notificationObj = {
							_id: ObjectId(),
							message: "A new reply on your ticket \"" + ticket.title + "\".",
							ticket: {
								_id: ticket._id,
								title: ticket.title
							},
							by: {
								_id: user._id,
								name: user.name
							},
							user: {
								_id: rep._id,
								name: rep.name
							},
							isRead: false,
							createdAt: new Date().getTime()
						}

						// add in notifications
						await global.db.collection("notifications").insertOne(notificationObj)
						// break

						try {
							global.socketIO.to(global.users[rep._id.toString()]).emit("newReply/" + ticket._id.toString(), {
								ticketId: _id,
								reply: replyObj
							})

							global.socketIO.to(global.users[rep._id.toString()]).emit("newNotification", "New reply on ticket '" + ticket.title + "'.")
						} catch (exp) {
							console.error(exp)
						}
					})
				} else if (user.role == "representative") {
					const notificationObj = {
						_id: ObjectId(),
						message: "A new reply on your ticket \"" + ticket.title + "\".",
						ticket: {
							_id: ticket._id,
							title: ticket.title
						},
						by: {
							_id: user._id,
							name: user.name
						},
						user: {
							_id: ticket.createdBy._id,
							name: ticket.createdBy.name
						},
						isRead: false,
						createdAt: new Date().getTime()
					}

					// add in notifications
					await global.db.collection("notifications").insertOne(notificationObj)

					try {
						global.socketIO.to(global.users[ticket.createdBy._id.toString()]).emit("newReply/" + ticket._id.toString(), {
								ticketId: _id,
								reply: replyObj
							})

						global.socketIO.to(global.users[ticket.createdBy._id.toString()]).emit("newNotification", "New reply on ticket '" + ticket.title + "'.")
					} catch (exp) {
						console.error(exp)
					}
				}

				result.json({
		    		status: "success",
		    		message: "Reply has been posted.",
		    		reply: replyObj,
		    		ticketStatus: status
		    	})
		    })
		})

		router.post("/downloadScreenshot", auth, async function (request, result) {
			const user = request.user
			const ticketId = request.fields.ticketId
			const _id = request.fields._id

			let searchObj = {
		    	"createdBy._id": user._id
		    }

		    if (user.role == "representative") {
		    	searchObj = {}
		    }

			const ticket = await global.db.collection("tickets").findOne({
				$and: [{
		    		_id: ObjectId(ticketId)
		    	}, searchObj, {
		    		"screenshots._id": ObjectId(_id)
		    	}]
			})

		    if (ticket == null) {
		    	result.json({
		    		status: "error",
		    		message: "Ticket not found."
		    	})

		    	return
		    }

		    let base64 = ""
		    let screenshot = null

		    for (let a = 0; a < ticket.screenshots.length; a++) {
		    	if (ticket.screenshots[a]._id.toString() == _id) {
		    		// result.download(ticket.screenshots[a].path)

		    		// read binary data
				    const bitmap = fileSystem.readFileSync(ticket.screenshots[a].path)

				    // convert binary data to base64 encoded string
				    let base64 = new Buffer(bitmap).toString("base64")
				    base64 = "data:image/png;base64," + base64

				    screenshot = {
				    	base64: base64,
				    	name: ticket.screenshots[a].name ?? "download.png"
				    }
		    		break
		    	}
		    }

		    if (screenshot == null) {
		    	result.json({
		    		status: "error",
		    		message: "Unable to download the image."
		    	})

		    	return
		    }

		    result.json({
	    		status: "success",
	    		message: "Data has been fetched.",
	    		screenshot: screenshot
	    	})
		})

		router.post("/fetch", auth, async function (request, result) {
			const user = request.user
			const _id = request.fields._id

			let searchObj = {
		    	"createdBy._id": user._id
		    }

		    if (user.role == "representative") {
		    	searchObj = {}
		    }

			const ticket = await global.db.collection("tickets").findOne({
		    	$and: [{
		    		_id: ObjectId(_id)
		    	}, searchObj]
		    })

		    if (ticket == null) {
		    	result.json({
		    		status: "error",
		    		message: "Ticket not found."
		    	})

		    	return
		    }

		    result.json({
	    		status: "success",
	    		message: "Data has been fetched.",
	    		ticket: ticket
	    	})
		})

		router.post("/", auth, async function (request, result) {
			const user = request.user

			let searchObj = {
		    	"createdBy._id": user._id
		    }

		    if (user.role == "representative") {
		    	searchObj = {}
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

			const tickets = await global.db.collection("tickets").find(searchObj)
				.sort({ updatedAt: -1 })
		        .skip(startFrom)
		        .limit(perPage)
		        .toArray()

		    result.json({
	    		status: "success",
	    		message: "Data has been fetched.",
	    		tickets: tickets,
	    		pages: pages,
	    		pageNumber: parseInt(pageNumber)
	    	})
		})

		router.post("/create", auth, async function (request, result) {
			const user = request.user
			const title = request.fields.title
			const description = request.fields.description

			if (!title || !description) {
				result.json({
					status: "error",
					message: "Please enter all values."
				})

				return
			}

		    const images = []
		    if (Array.isArray(request.files.images)) {
		        for (let a = 0; a < request.files.images.length; a++) {
		        	images.push(request.files.images[a])
		        }
		    } else {
		        images.push(request.files.images)
		    }

		    self.callbackFileUpload(images, 0, [], async function (savedPaths) {
		        const ticketObj = {
					_id: ObjectId(),
					title: title,
					description: description,
					screenshots: savedPaths,
					createdBy: {
						_id: user._id,
						name: user.name
					},
					status: "Open", // Open, Closed, Waiting reply, Answered
					replies: [],
					createdAt: new Date().getTime(),
					updatedAt: new Date().getTime()
				}

				await global.db.collection("tickets").insertOne(ticketObj)

				// get all reps
				// emit event
				const representatives = await global.db.collection("users").find({
					role: "representative"
				}).toArray()

				representatives.forEach(function (rep) {
					try {
						global.socketIO.to(global.users[rep._id.toString()]).emit("newTicket", ticketObj)
					} catch (exp) {
						console.error(exp)
					}
				})

				result.json({
					status: "success",
					message: "Ticket has been created.",
					ticket: ticketObj
				})
		    })
		})

		app.use("/tickets", router)
	},

	callbackFileUpload: function(images, index, savedPaths = [], success = null) {
		const self = this

		if (images.length > index) {
			
			if (images[index].size == 0) {
				index++
				self.callbackFileUpload(images, index, savedPaths, success)
			} else {

				fileSystem.readFile(images[index].path, function (error, data) {
					if (error) {
						console.error(error)
						return
					}

					const filePath = "uploads/" + new Date().getTime() + "-" + images[index].name
					
					fileSystem.writeFile(filePath, data, async function (error) {
						if (error) {
							console.error(error)
							return
						}

						savedPaths.push({
							_id: ObjectId(),
							name: images[index].name,
							path: filePath
						})

						if (index == (images.length - 1)) {
							success(savedPaths)
						} else {
							index++
							self.callbackFileUpload(images, index, savedPaths, success)
						}
					})

					fileSystem.unlink(images[index].path, function (error) {
						if (error) {
							console.error(error)
							return
						}
					})
				})
			}
		} else {
			success(savedPaths)
		}
	}
}