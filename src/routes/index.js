var express = require('express');
var router = express.Router();
require('dotenv').config({path:__dirname+'/./../../.env'})
// var passport = require('passport')
// 	    , OAuthStrategy = require('passport-oauth').OAuthStrategy;

var fs = require("fs");
var log = function(msg) {
    fs.appendFileSync('/home/djbrenne/webapps/authnode/debug.log', msg + '\n');
};



var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/');
}



module.exports = function(passport){

	/* GET login page. */
	router.get('/', function(req, res) {
    	// Display the Login page with any flash message, if any
		res.render('index', { message: req.flash('message'), user: req.user })

	});

	/* Handle Login POST */
	router.post('/login', passport.authenticate('login', {
		successRedirect: '/home',
		failureRedirect: '/',
		failureFlash : true
	}));

	/* GET Registration Page */
	router.get('/signup', function(req, res){
		res.render('register',{message: req.flash('message')});
	});

	/* Handle Registration POST */
	router.post('/signup', passport.authenticate('signup', {
		successRedirect: '/home',
		failureRedirect: '/signup',
		failureFlash : true
	}));



	/* GET Home Page */
	router.get('/home', isAuthenticated, function(req, res){
		res.render('home', { user: req.user });
	});

	router.get('/jademap', function(req, res){
		console.log("loading google maps api " + process.env.GOOGLE_MAPS_API)
		res.render('jademap', { user: req.user, mapskey: process.env.GOOGLE_MAPS_API });
	});



	/* Handle Logout */
	router.get('/signout', function(req, res) {
		req.logout();
		res.redirect('/home');
	});


	router.get('/auth/facebook',
  passport.authenticate('facebook'),
  function(req, res){});

router.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/home');
  });




	return router;
}
