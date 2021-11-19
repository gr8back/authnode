var mongoose = require('mongoose');

module.exports = mongoose.model('NewsUser',{
    username: String,
    password: String,
    email: String,
    firstName: String,
    lastName: String
});
