'use strict';
var router = require('express').Router();
var AV = require('leanengine');

router.get('/', function(req, res) {
    if(req.currentUser){
    	res.render('index');
    }else{
    	res.redirect('login');
    }
});

router.get('/customer', function(req, res) {
    if(req.currentUser){
    	res.render('customer');
    }else{
    	res.redirect('login');
    }
});

router.get('/flot', function(req, res) {
    if(req.currentUser){
    	res.render('flot');
    }else{
    	res.redirect('login');
    }
});

router.get('/morris', function(req, res) {
    if(req.currentUser){
    	res.render('morris');
    }else{
    	res.redirect('login');
    }
});
module.exports = router;
