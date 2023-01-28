import { createApp } from "vue"
import App from "./App.vue"
import { createRouter, createWebHistory } from "vue-router"

import HomeComponent from "./components/HomeComponent.vue"
import RegisterComponent from "./components/RegisterComponent.vue"
import LoginComponent from "./components/LoginComponent.vue"
import TicketDetailComponent from "./components/TicketDetailComponent.vue"
import TicketsComponent from "./components/TicketsComponent.vue"
import NotificationsComponent from "./components/NotificationsComponent.vue"
import NotificationDetailComponent from "./components/NotificationDetailComponent.vue"

const app = createApp(App)

const routes = [
	{ path: "/notifications/fetch/:_id", component: NotificationDetailComponent },
	{ path: "/notifications/all/:page?", component: NotificationsComponent },
	
	{ path: "/tickets/fetch/:_id", component: TicketDetailComponent },
	{ path: "/tickets/all/:page?", component: TicketsComponent },

	{ path: "/login", component: LoginComponent },
	{ path: "/register", component: RegisterComponent },

	{ path: "/", component: HomeComponent }
]

const router = createRouter({
	history: createWebHistory(),
	routes
})

app.use(router)

app.config.globalProperties.$mainURL = "http://localhost:8080"
app.config.globalProperties.$apiURL = "http://localhost:3000"
app.config.globalProperties.$accessToken = "accessToken"
app.config.globalProperties.$headers = {
    Accept: "application/json",
    Authorization: "Bearer " + localStorage.getItem("accessToken")
}

app.mixin({
	methods: {
		dateTimeInFormat: function (timestamps) {
			const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

			const dateObj = new Date(timestamps)
			let date = dateObj.getDate()
			if (date < 10) {
				date = "0" + date
			}
			const month = months[dateObj.getMonth()]
			const year = dateObj.getFullYear()

			let hours = dateObj.getHours()
			if (hours < 10) {
				hours = "0" + hours
			}

			let minutes = dateObj.getMinutes()
			if (minutes < 10) {
				minutes = "0" + minutes
			}
			
			let seconds = dateObj.getSeconds()
			if (seconds < 10) {
				seconds = "0" + seconds
			}

			return date + " " + month + ", " + year + " " + hours + ":" + minutes + ":" + seconds
		}
	}
})

app.mount("#app")