<template>
	<nav class="navbar navbar-expand-lg navbar-light bg-light" style="margin-bottom: 50px;">
		<div class="container">
			<router-link class="navbar-brand" to="/">Ticketing</router-link>
			
			<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
				<span class="navbar-toggler-icon"></span>
			</button>

			<div class="collapse navbar-collapse" id="navbarSupportedContent">
				<ul class="navbar-nav me-auto mb-2 mb-lg-0">
					<li class="nav-item">
						<router-link v-bind:class="'nav-link ' + ($route.path == '/' ? 'active' : '')" to="/">Home</router-link>
					</li>

					<template v-if="user == null">
						<li class="nav-item">
							<router-link v-bind:class="'nav-link ' + ($route.path == '/login' ? 'active' : '')" to="/login">Login</router-link>
						</li>

						<li class="nav-item">
							<router-link v-bind:class="'nav-link ' + ($route.path == '/register' ? 'active' : '')" to="/register">Register</router-link>
						</li>
					</template>

					<template v-else>
						<li class="nav-item dropdown">
							<a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
								<span v-text="user.name"></span>&nbsp;
								<i class="fa fa-caret-down"></i>
							</a>

							<ul class="dropdown-menu" aria-labelledby="userDropdown">
								<li>
									<a class="dropdown-item" href="javascript:void(0)" v-on:click="doLogout" v-text="isLoggingOut ? 'Logging out...' : 'Logout'" v-bind:disabled="isLoggingOut"></a>
								</li>
							</ul>
						</li>

						<li class="nav-item">
							<li class="nav-item dropdown">
								<a class="nav-link dropdown-toggle" href="#" id="notificationsDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
									<i class="fa fa-bell"></i>
									<i v-if="unreadNotifications > 0" class="fa fa-badge text-warning" style="margin-left: 5px;" v-text="'(' + unreadNotifications + ')'"></i>
								</a>

								<ul class="dropdown-menu" aria-labelledby="notificationsDropdown">
									<li v-for="notification in notifications" v-bind:key="notification._id">
										<router-link v-bind:class="'dropdown-item ' + (notification.isRead ? '' : 'unread-notification')" v-bind:to="'/notifications/fetch/' + notification._id" v-text="notification.message">
										</router-link>
									</li>

									<li><hr class="dropdown-divider" /></li>

									<li>
										<router-link class="dropdown-item" to="/notifications/all">
											All notifications
										</router-link>
									</li>
								</ul>
							</li>
						</li>
					</template>
				</ul>
			</div>
		</div>
	</nav>
</template>

<script>

	import "../../assets/css/bootstrap.css"
	import "../../assets/fontawesome/css/all.css"

	import axios from "axios"
    import swal from "sweetalert2"
    import store from "../../vuex/store"
    import { io } from "socket.io-client"
    import jQuery from "jquery"

	export default {
		name: "AppHeader",

		computed: {

			user: function () {
				return store.getters.getUser
			},

			unreadNotifications: function () {
				return store.getters.getUnreadNotifications
			},

			notifications: function () {
				return store.getters.getNotifications
			}
		},

		data() {
			return {
				isLoggingOut: false,
				socketIO: null
			}
		},

		methods: {
			doLogout: async function () {
				this.isLoggingOut = true

			    const response = await axios.post(
			        this.$apiURL + "/logout",
			        null,
			        {
			            headers: this.$headers
			        }
			    )

			    this.isLoggingOut = false

			    if (response.data.status == "success") {
			        // remove access token from local storage
			        localStorage.removeItem(this.$accessToken)
			        store.commit("setUser", null)
			        this.$headers.Authorization = "Bearer"
			        this.$router.push("/login")
			    } else {
			        swal.fire("Error", response.data.message, "error")
			    }
			},

            getUser: async function () {
                const response = await axios.post(
                    this.$apiURL + "/getUser",
                    null,
                    {
                        headers: this.$headers
                    }
                )

                if (response.data.status == "success") {
                    // user is logged in
                    const user = response.data.user
                    const tickets = response.data.tickets

                    store.commit("setUser", user)
                    store.commit("setUnreadNotifications", response.data.unreadNotifications)
                    store.commit("setNotifications", response.data.notifications)

                    this.socketIO.emit("connected", user._id)
                    this.socketIO.on("newNotification", function (data) {
                    	jQuery.notify(data, "success")
                    })

                    /*for (let a = 0; a < tickets.length; a++) {
                    	this.socketIO.on("newReply/" + tickets[a]._id.toString(), function (data) {
                    		const ticketId = store.getters.getTicketId
                    		if (ticketId == data.ticketId) {
	                    		store.commit("appendReply", data.reply)
	                    	}
	                    })
                    }*/

                    this.socketIO.on("newReply", function (data) {
                		const ticketId = store.getters.getTicketId
                		if (ticketId == data.ticketId) {
                    		store.commit("appendReply", data.reply)
                    	}
                    })
                }
            }
        },

        mounted: function () {
        	this.socketIO = io(this.$apiURL)
            this.getUser()
        }
	}
</script>

<style scoped>
	.dropdown-toggle::after {
		display: none;
	}
	.unread-notification {
		background-color: #1a8754;
		color: white;
	}
</style>