<template>
	<div class="container">
		<div class="row">
			<div class="col-md-12">
				<div class="d-flex justify-content-center" v-if="loading" style="margin-top: 50px; margin-bottom: 50px;">
					<div class="spinner-border" role="status">
						<span class="visually-hidden">Loading...</span>
					</div>
				</div>
			</div>
		</div>

		<div class="row">
			<div class="col-md-12 text-center" v-if="notification != null">
				<h2>Notification</h2>

				<br />

				<p v-text="notification.message"></p>

				<p>
					<router-link v-bind:to="'/tickets/fetch/' + notification.ticket._id" v-text="notification.ticket.title"></router-link>
				</p>

				<p v-text="dateTimeInFormat(notification.createdAt)"></p>
			</div>
		</div>
	</div>
</template>

<script>
	import axios from "axios"
    import swal from "sweetalert2"
    import store from "../vuex/store"

	export default {
		name: "NotificationDetailComponent",

		computed: {
			unreadNotifications: function () {
				return store.getters.getUnreadNotifications
			},

			notifications: function () {
				return store.getters.getNotifications
			}
		},

		data() {
			return {
				loading: false,
				_id: this.$route.params._id,
				notification: null
			}
		},

		methods: {
			getData: async function () {
				const self = this
				this.loading = true

                const formData = new FormData()
                formData.append("_id", this._id)

                const response = await axios.post(
                    this.$apiURL + "/notifications/fetch",
                    formData,
                    {
                    	headers: this.$headers
                    }
                )

                this.loading = false

                if (response.data.status == "success") {
                	this.notification = response.data.notification
                	
                	for (let a = 0; a < this.notifications.length; a++) {
                		if (this.notifications[a]._id.toString() == this.notification._id.toString()) {
                			this.notifications[a].isRead = true
                		}
                	}
                	store.commit("setNotifications", this.notifications)
                	store.commit("setUnreadNotifications", response.data.unreadNotifications)
                } else {
                	swal.fire("Error", response.data.message, "error")
                }
			}
		},

		mounted: function () {
			this.getData()
		}
	}
</script>