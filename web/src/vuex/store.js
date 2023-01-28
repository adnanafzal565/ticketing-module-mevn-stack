import { createStore } from "vuex"

export default createStore({
	state() {
		return {
			user: null,
			unreadNotifications: 0,
			notifications: [],
			replies: [],
			ticketId: 0
		}
	},

	mutations: {
		setTicketId: function (state, val) {
			state.ticketId = val
		},

		setReplies: function (state, val) {
			state.replies = val
		},

		appendReply: function (state, val) {
			state.replies.push(val)
		},

		setUnreadNotifications: function (state, val) {
			state.unreadNotifications = val
		},
		
		setNotifications: function (state, val) {
			state.notifications = val
		},

		setUser: function (state, val) {
			state.user = val
		}
	},

	getters: {
		getTicketId: function (state) {
			return state.ticketId
		},

		getReplies: function (state) {
			return state.replies
		},

		getUnreadNotifications: function (state) {
			return state.unreadNotifications
		},

		getNotifications: function (state) {
			return state.notifications
		},

		getUser: function (state) {
			return state.user
		}
	}
})