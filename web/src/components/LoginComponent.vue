<template>
    <div class="container">
        <div class="row">
            <div class="offset-md-3 col-md-6">
                <h1>Login</h1>

                <br />

                <form v-on:submit.prevent="doLogin">
                    <div class="form-group">
                        <label>Enter email</label>
                        <input type="email" class="form-control" name="email" />
                    </div>

                    <br />

                    <div class="form-group">
                        <label>Enter password</label>
                        <input type="password" class="form-control" name="password" />
                    </div>

                    <br />

                    <button type="submit" v-bind:disabled="isLoading" name="submit" class="btn btn-primary">
                        Login
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
    import store from "../vuex/store"

    export default {
        data() {
            return {
                isLoading: false
            }
        },

        methods: {
            doLogin: async function () {
                const form = event.target
                const formData = new FormData(form)

                this.isLoading = true

                const response = await axios.post(
                    this.$apiURL + "/login",
                    formData
                )

                this.isLoading = false

                if (response.data.status == "success") {
                    // get access token from server
                    const accessToken = response.data.accessToken
                    const user = response.data.user

                    // save in local storage
                    localStorage.setItem(this.$accessToken, accessToken)

                    this.$headers.Authorization = "Bearer " + accessToken
                    store.commit("setUser", user)
                    store.commit("setUnreadNotifications", response.data.unreadNotifications)
                    store.commit("setNotifications", response.data.notifications)

                    form.reset()

                    // to go to home page without refreshing
                    this.$router.push("/")
                } else {
                    swal.fire("Error", response.data.message, "error")
                }
            }
        }
    }
</script>