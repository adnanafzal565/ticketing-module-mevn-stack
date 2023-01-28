<template>
    <div class="container">
        <div class="row">
            <div class="offset-md-3 col-md-6">
                <h1>Register</h1>

                <br />

                <form v-on:submit.prevent="doRegister">
                    <div class="form-group">
                        <label>Enter name</label>
                        <input type="text" class="form-control" name="name" required />
                    </div>

                    <br />

                    <div class="form-group">
                        <label>Enter email</label>
                        <input type="email" class="form-control" name="email" required />
                    </div>

                    <br />

                    <div class="form-group">
                        <label>Enter password</label>
                        <input type="password" class="form-control" name="password" required />
                    </div>

                    <br />

                    <button type="submit" v-bind:disabled="isLoading" name="submit" class="btn btn-primary">
                        Register
                        <i class="fa fa-spinner fa-spin" v-if="isLoading"></i>
                    </button>
                </form>
            </div>
        </div>
    </div>
</template>

<script>

    import axios from "axios"
    import swal from "sweetalert2"

    export default {
        name: "RegisterComponent",

        data() {
            return {
                isLoading: false
            }
        },

        methods: {
            doRegister: async function () {
                const form = event.target
                const formData = new FormData(form)

                this.isLoading = true

                const response = await axios.post(
                    this.$apiURL + "/registration",
                    formData
                )
                
                this.isLoading = false
                swal.fire("Registration", response.data.message, response.data.status)

                if (response.data.status == "success") {
                    form.reset()
                }
            }
        }
    }
</script>