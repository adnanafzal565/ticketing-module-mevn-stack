<template>
	<div class="container">
		<div class="row">
			<div class="col-md-12">
				<h2 class="text-center">Notifications</h2>

				<br />

				<div class="d-flex justify-content-center" v-if="loading" style="margin-top: 50px; margin-bottom: 50px;">
					<div class="spinner-border" role="status">
						<span class="visually-hidden">Loading...</span>
					</div>
				</div>

				<br />

				<button type="button" class="btn btn-primary btn-sm" style="margin-bottom: 20px;" v-bind:disabled="markingAsRead" v-on:click="markAllAsRead">
					Mark all as read

					<i class="fa fa-spinner fa-spin" v-if="markingAsRead"></i>
				</button>

				<table class="table table-responsive table-bordered">
					<thead>
						<tr>
							<th>Message</th>
							<th>From</th>
							<th>Date & time</th>
						</tr>
					</thead>

					<tbody>
						<tr v-for="notification in notifications" v-bind:key="notification._id">
							<td>
								<router-link v-bind:to="'/notifications/fetch/' + notification._id" v-text="notification.message"></router-link>
							</td>
							<td v-text="notification.by.name"></td>
							<td v-text="dateTimeInFormat(notification.createdAt)"></td>
						</tr>
					</tbody>
				</table>

				<nav v-if="pages > 1">
					<ul class="pagination">
						<li v-for="page in pages" v-bind:class="'page-item ' + (page == pageNumber ? 'active' : '')">
							<router-link class="page-link" v-bind:to="'/tickets/all/' + page" v-text="page" v-on:click="paginate(page)"></router-link>
						</li>
					</ul>
				</nav>
			</div>
		</div>
	</div>
</template>

<script>

	import axios from "axios"
    import swal from "sweetalert2"
    import store from "../vuex/store"

	export default {
		name: "NotificationsComponent",

		data() {
			return {
				notifications: [],
				pageNumber: this.$route.params.page ?? 1,
				pages: 0,
				loading: false,
				markingAsRead: false
			}
		},

		methods: {
			markAllAsRead: async function () {
				this.markingAsRead = true

                const response = await axios.post(
                    this.$apiURL + "/notifications/markAllAsRead",
                    null,
                    {
                    	headers: this.$headers
                    }
                )

                this.markingAsRead = false
                swal.fire("Mark notifications as read", response.data.message, response.data.status)

                if (response.data.status == "success") {
                	for (let a = 0; a < this.notifications.length; a++) {
                		this.notifications[a].isRead = true
                	}
                	store.commit("setNotifications", this.notifications)
                	store.commit("setUnreadNotifications", 0)
                }
			},

			paginate: function (page) {
				this.pageNumber = page
				this.getData()
			},

			getData: async function () {
                this.loading = true

                if (this.pageNumber == "") {
                	this.pageNumber = 1
                }

                const formData = new FormData()
                formData.append("page", this.pageNumber)

                const response = await axios.post(
                    this.$apiURL + "/notifications",
                    formData,
                    {
                    	headers: this.$headers
                    }
                )

                this.loading = false

                if (response.data.status == "success") {
                	this.notifications = response.data.notifications
                	this.pages = response.data.pages
                	this.pageNumber = response.data.pageNumber
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