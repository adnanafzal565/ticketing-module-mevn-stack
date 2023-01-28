<template>
	<!-- Footer -->
	<footer class="text-center text-lg-start bg-light text-muted" style="margin-top: 50px;">
	  <!-- Copyright -->
	  <div class="text-center p-4" style="background-color: rgba(0, 0, 0, 0.05);">
	    © <span v-text="year"></span> Copyright:
	    <a class="text-reset fw-bold" href="https://adnan-tech.com">adnan-tech.com</a>
	  </div>
	  <!-- Copyright -->
	</footer>
	<!-- Footer -->
</template>

<script>

	import jQuery from "jquery"
	import "../../assets/js/bootstrap.js"
	import "../../assets/js/notify.js"

	export default {
		name: "AppFooter",

		data() {
			return {
				year: new Date().getFullYear()
			}
		}
	}
</script>