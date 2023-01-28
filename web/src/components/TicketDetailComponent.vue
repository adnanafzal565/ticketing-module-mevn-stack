<template>
	<div class="container">
		<div class="d-flex justify-content-center" v-if="loading">
			<div class="spinner-border" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>

		<template v-if="ticket != null && user != null">
			<div class="row">
				<div class="col-md-12">
					<div class="card">
						<div class="card-header">
							<div class="row">
								<div class="col-md-6">
									<h1 class="card-title" v-text="ticket.title"></h1>
									<p>Created by: <span v-text="ticket.createdBy.name"></span></p>
								</div>

								<div class="offset-md-4 col-md-2">
									<p v-text="ticket.status.toUpperCase()" style="margin-top: 10px;"></p>

									<button type="button" class="btn btn-danger" v-bind:disabled="closingTicket" v-on:click="closeTicket" v-if="user.role == 'representative' && ticket.status != 'Closed'">
										Close

										<i class="fa fa-spinner fa-spin" v-if="closingTicket"></i>
									</button>

									<p v-if="ticket.status == 'Closed'">Closed by <span v-text="ticket.closedBy.name"></span></p>
								</div>
							</div>
						</div>

						<div class="card-body">
							<p v-text="ticket.description"></p>

							<div v-for="image in ticket.screenshots" style="display: inline-block;">
								<a href="javascript:void(0)" class="btn btn-link" v-text="image.path" style="padding-left: 0px;" v-on:click="downloadFile(image._id)"></a>
							</div>
						</div>
					</div>
				</div>
			</div>

			<br />

			<template v-for="reply in replies" v-bind:key="reply._id">
				<div class="row">
					<div class="col-md-12">
						<div class="card">
							<div class="card-body">
								<span v-text="dateTimeInFormat(reply.createdAt)" style="float: right;"></span>
								<h4 v-text="reply.by.name"></h4>
								<p v-text="reply.message"></p>
							</div>
						</div>
					</div>
				</div>

				<br />
			</template>

			<div class="row" v-if="ticket.status != 'Closed'">
				<div class="col-md-12">
					<div class="card">
						<div class="card-body">
							<form v-on:submit.prevent="replyTicket" enctype="multipart/form-data">
								<div class="form-group">
									<label>Your message:</label>
									<textarea name="message" class="form-control" required></textarea>
								</div>

								<br />

								<div class="form-group">
									<label>Attach files:</label>
									<input type="file" name="files" class="form-control" multiple />
								</div>

								<br />

								<button type="submit" v-bind:disabled="replying" class="btn btn-primary">
									Reply

									<i class="fa fa-spinner fa-spin" v-if="replying"></i>
								</button>
							</form>
						</div>
					</div>
				</div>
			</div>
		</template>
	</div>

	<a v-if="screenshot != null" v-bind:href="screenshot.base64" ref="btnDownload" v-bind:download="screenshot.name"></a>
</template>

<script>

	import axios from "axios"
    import swal from "sweetalert2"
    import store from "../vuex/store"

	export default {
		name: "TicketDetailComponent",

		computed: {
			user: function () {
				return store.getters.getUser
			},

			replies: function () {
				return store.getters.getReplies
			}
		},

		data() {
			return {
				ticket: null,
				loading: false,
				_id: this.$route.params._id,
				screenshot: null,
				replying: false,
				closingTicket: false
			}
		},

		methods: {
			closeTicket: async function () {
				const self = this

				swal.fire({
					title: 'Do you want to close this ticket ?',
					showCancelButton: true,
					confirmButtonText: "Close ticket",
				}).then(async function (result) {
					if (result.isConfirmed) {
						self.closingTicket = true

		                const formData = new FormData()
		                formData.append("_id", self._id)

		                const response = await axios.post(
		                    self.$apiURL + "/tickets/close",
		                    formData,
		                    {
		                    	headers: self.$headers
		                    }
		                )

		                self.closingTicket = false

		                if (response.data.status == "success") {
		                	self.ticket.status = response.data.ticketStatus
		                	self.ticket.closedBy = response.data.closedBy
		                } else {
		                	swal.fire("Error", response.data.message, "error")
		                }
					}
				})
			},

			replyTicket: async function () {
				this.replying = true

				const form = event.target
                const formData = new FormData(form)
                formData.append("_id", this._id)

                const response = await axios.post(
                    this.$apiURL + "/tickets/reply",
                    formData,
                    {
                    	headers: this.$headers
                    }
                )

                this.replying = false

                if (response.data.status == "success") {
                	form.reset()
                	store.commit("appendReply", response.data.reply)
                	this.ticket.status = response.data.ticketStatus
                } else {
                	swal.fire("Error", response.data.message, "error")
                }
			},

			downloadFile: async function (_id) {
				const self = this
				const anchor = event.target
				const originalHtml = anchor.innerHTML
				
				anchor.innerHTML = "Loading..."
				anchor.setAttribute("disabled", "disabled")

                const formData = new FormData()
                formData.append("ticketId", this._id)
                formData.append("_id", _id)

                const response = await axios.post(
                    this.$apiURL + "/tickets/downloadScreenshot",
                    formData,
                    {
                    	headers: this.$headers
                    }
                )

                anchor.removeAttribute("disabled")
                anchor.innerHTML = originalHtml

                if (response.data.status == "success") {
                	// console.log(response.data)

                	this.screenshot = response.data.screenshot
                	
                	setTimeout(function() {
                		self.$refs["btnDownload"].click()
                	}, 500)
                } else {
                	swal.fire("Error", response.data.message, "error")
                }
			},

			getData: async function () {
                this.loading = true

                const formData = new FormData()
                formData.append("_id", this._id)

                const response = await axios.post(
                    this.$apiURL + "/tickets/fetch",
                    formData,
                    {
                    	headers: this.$headers
                    }
                )

                this.loading = false

                if (response.data.status == "success") {
                	this.ticket = response.data.ticket
                	const replies = this.ticket.replies || []
                	store.commit("setReplies", replies)
                	store.commit("setTicketId", this._id)
                } else {
                	swal.fire("Error", response.data.message, "error")
                }
			}
		},

		mounted: function () {
			const self = this
			this.getData()
		}
	}
</script>