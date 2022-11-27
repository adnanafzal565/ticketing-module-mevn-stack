const jwt = require("jsonwebtoken")

module.exports = async function (request, result, next) {
    try {
        const accessToken = request.headers.authorization.split(" ")[1]
        const decoded = jwt.verify(accessToken, global.jwtSecret)
        const userId = decoded.userId

        const user = await global.db.collection("users").findOne({
            accessToken: accessToken
        })

		if (user == null) {
			result.json({
	            status: "error",
	            message: "User has been logged out."
	        })
            
			return
		}

        request.user = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }

        next()
    } catch (exp) {
        result.json({
            status: "error",
            message: "User has been logged out."
        })
    }
}