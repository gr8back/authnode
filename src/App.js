var http = require('http');
var express = require('express');
var expressSession = require('express-session');
var app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
});
var expose = require('express-expose');
var router = express.Router();
var passport = require('passport')
  // , FacebookStrategy = require('passport-facebook').Strategy;

require('dotenv').config()
var nicknamesarray = [];
var fs = require("fs");
var log = function(msg) {
    fs.appendFileSync('/users/djbrenne/pycharmprojects/authnode/myapp/debug.log', msg + '\n');
};
var LocalStrategy   = require('passport-local').Strategy;
var User = require('./models/user');
var bCrypt = require('bcrypt-nodejs');


server.listen(3000, () => {
  console.log('listening on *:3000');
});


var mongodb = require('mongodb');
var mongoose = require('mongoose');
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
mongoose.connect('mongodb://localhost:27017/admin');

var db = mongoose.connection;

db.on('error', function(err){
   log('Mongoose default connection error: ' + err);
});
db.once('open', function() {
  log("successfully opened db");
});


log("connection started");

log('the nickname array contains' + nicknamesarray);



    io.on('connection', client => {
          console.log('a user connected');
   client.emit('welcome', { message: 'Welcome!', id: "12" });
  client.on('event', data => {console.log("io event")});
  client.on('disconnect', () => {console.log("io disconnect")});

  client.on('new user', function(data, callback){
        console.log(data);
        console.log(nicknamesarray);
        if(nicknamesarray.indexOf(data) != -1) {

            log('name in array');
        } else {
            log('nickname is a new one');

            log('the new user is ' + data);
            client.nickname= data;
            nicknamesarray.push(client.nickname);
            io.sockets.emit('usernames', nicknamesarray);

        };
        });
  client.on('chat message', function(msg){
    io.emit('chat message', {data:msg, nick: client.nickname});
    log('message: ' + msg);
  });


   client.on('disconnect', function(){
        log('user disconnected');
        nicknamesarray.splice(nicknamesarray.indexOf(client.nickname), 1);
        io.sockets.emit('usernames', nicknamesarray);
      });

});


app.use(express.static('../css'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(expressSession({secret: 'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());
//app.use(app.router);

var flash=require("connect-flash");
app.use(flash());

app = expose(app);
app.expose('var some = "variable";');

var routes = require('./routes/index')(passport);
app.use('/', routes);

    passport.serializeUser(function(user, done) {
        log('serializing user: ');
        log(user);
        done(null, user._id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            log('deserializing user:',user);
            done(err, user);
        });
    });

    var isValidPassword = function(user, password){
        return bCrypt.compareSync(password, user.password);
    };

	passport.use('login', new LocalStrategy({
            passReqToCallback : true
        },
        function(req, username, password, done) {
            // check in mongo if a user with username exists or not
            User.findOne({ 'username' :  username },
                function(err, user) {
                    // In case of any error, return using the done method
                    if (err)
                        return done(err);
                    // Username does not exist, log the error and redirect back
                    if (!user){
                        log('User Not Found with username '+username);
                        return done(null, false, req.flash('message', 'User Not found.'));
                    }
                    // User exists but wrong password, log the error
                    if (!isValidPassword(user, password)){
                        log('Invalid Password');
                        return done(null, false, req.flash('message', 'Invalid Password')); // redirect back to login page
                    }
                    // User and password both match, return user from done method
                    // which will be treated like success
                    return done(null, user);
                }
            );

        })
    );

	passport.use('signup', new LocalStrategy({
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) {

            var findOrCreateUser = function(){
                User.findOne({ 'username' :  username }, function(err, user) {
                    if (err){
                        console.log('Error in SignUp: '+err);
                        return done(err);
                    }
                    if (user) {
                        console.log('User already exists with username: '+username);
                        return done(null, false, req.flash('message','User Already Exists'));
                    } else {
                        var newUser = new User();

                        newUser.username = username;
                        newUser.password = createHash(password);
                        newUser.email = req.params('email');
                        newUser.firstName = req.params('firstName');
                        newUser.lastName = req.params('lastName');

                        newUser.save(function(err) {
                            if (err){
                                console.log('Error in Saving user: '+err);
                                throw err;
                            }
                            console.log('User Registration succesful');
                            return done(null, newUser);
                        });
                    }
                });
            };
            process.nextTick(findOrCreateUser);
        })
    );


// passport.use(new FacebookStrategy({
//     clientID: FACEBOOK_APP_ID,
//     clientSecret: FACEBOOK_APP_SECRET,
//     callbackURL: "http://www.example.com/auth/facebook/callback"
//   },
//   function(accessToken, refreshToken, profile, done) {
//     User.findOrCreate(..., function(err, user) {
//       if (err) { return done(err); }
//       done(null, user);
//     });
//   }
// ));



    // Generates hash using bCrypt
    var createHash = function(password){
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    };


module.exports = router;
module.exports = app;
