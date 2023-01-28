<template>
	<div class="container">
		<div class="row">
			<div class="col-md-12">
				<button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#createTicketModal">
					Create ticket
				</button>
			</div>
		</div>

		<br />

		<div class="row">
			<div class="col-md-12">
				<h2 class="text-center">Tickets</h2>

				<div class="d-flex justify-content-center" v-if="loading" style="margin-top: 50px; margin-bottom: 50px;">
					<div class="spinner-border" role="status">
						<span class="visually-hidden">Loading...</span>
					</div>
				</div>

				<table class="table table-responsive table-bordered" id="tickets-table">
					<thead>
						<tr>
							<th>Title</th>
							<th>Created by</th>
							<th>Status</th>
							<th>Created at</th>
							<th>Actions</th>
						</tr>
					</thead>

					<tbody>
						<tr v-for="ticket in tickets" v-bind:key="ticket._id">
							<td v-text="ticket.title"></td>
							<td v-text="ticket.createdBy.name"></td>
							<td v-text="ticket.status.toUpperCase()"></td>
							<td v-text="dateTimeInFormat(ticket.createdAt)"></td>
							<td>
								<router-link v-bind:to="'/tickets/fetch/' + ticket._id" class="btn btn-info" style="color: white;">
									View
								</router-link>
							</td>
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

	<!-- Modal -->
	<div class="modal" id="createTicketModal">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title">Create ticket</h5>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>

				<div class="modal-body">
					<form id="form-create-ticket" enctype="multipart/form-data" v-on:submit.prevent="createTicket">
						<div class="form-group">
							<label>Title</label>
							<input type="text" name="title" class="form-control" required />
						</div>

						<br />

						<div class="form-group">
							<label>Description</label>
							<textarea name="description" class="form-control" required></textarea>
						</div>

						<br />

						<div class="form-group">
							<label>Attach screenshots</label>
							<input type="file" multiple accept="image/*" name="images" class="form-control" />
						</div>
					</form>
				</div>

				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					
					<button type="submit" v-bind:disabled="creatingTicket" form="form-create-ticket" class="btn btn-primary">
						Create ticket

						<i class="fa fa-spinner fa-spin" v-if="creatingTicket"></i>
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script>

	import axios from "axios"
    import swal from "sweetalert2"

	export default {
		name: "TicketsComponent",

		data() {
			return {
				tickets: [],
				creatingTicket: false,
				pageNumber: this.$route.params.page ?? 1,
				pages: 0,
				loading: false
			}
		},

		methods: {
			createTicket: async function () {
                this.creatingTicket = true

                const form = event.target
                const formData = new FormData(form)

                const response = await axios.post(
                    this.$apiURL + "/tickets/create",
                    formData,
                    {
                    	headers: this.$headers
                    }
                )

                this.creatingTicket = false
                swal.fire("Create ticket", response.data.message, response.data.status)

                if (response.data.status == "success") {
                	form.reset()
                	this.tickets.unshift(response.data.ticket)
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
                    this.$apiURL + "/tickets",
                    formData,
                    {
                    	headers: this.$headers
                    }
                )

                this.loading = false

                if (response.data.status == "success") {
                	this.tickets = response.data.tickets
                	this.pages = response.data.pages
                	this.pageNumber = response.data.pageNumber
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