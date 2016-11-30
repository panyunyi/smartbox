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

router.get('/product', function(req, res) {
    if(req.currentUser){
    	res.render('product');
    }else{
    	res.redirect('login');
    }
});

router.get('/assortment', function(req, res) {
    if(req.currentUser){
    	res.render('assortment');
    }else{
    	res.redirect('login');
    }
});

router.get('/borrow', function(req, res) {
    if(req.currentUser){
    	res.render('borrow');
    }else{
    	res.redirect('login');
    }
});

router.get('/box', function(req, res) {
    if(req.currentUser){
    	res.render('box');
    }else{
    	res.redirect('login');
    }
});

router.get('/checklist', function(req, res) {
    if(req.currentUser){
    	res.render('checklist');
    }else{
    	res.redirect('login');
    }
});

router.get('/checkrecord', function(req, res) {
    if(req.currentUser){
    	res.render('checkrecord');
    }else{
    	res.redirect('login');
    }
});

router.get('/cusemp', function(req, res) {
    if(req.currentUser){
    	res.render('cusemp');
    }else{
    	res.redirect('login');
    }
});

router.get('/cusproduct', function(req, res) {
    if(req.currentUser){
    	res.render('cusproduct');
    }else{
    	res.redirect('login');
    }
});

router.get('/empcard', function(req, res) {
    if(req.currentUser){
    	res.render('empcard');
    }else{
    	res.redirect('login');
    }
});

router.get('/emppower', function(req, res) {
    if(req.currentUser){
    	res.render('emppower');
    }else{
    	res.redirect('login');
    }
});

router.get('/passtock', function(req, res) {
    if(req.currentUser){
    	res.render('passtock');
    }else{
    	res.redirect('login');
    }
});

router.get('/pastrade', function(req, res) {
    if(req.currentUser){
    	res.render('pastrade');
    }else{
    	res.redirect('login');
    }
});

router.get('/replenishment', function(req, res) {
    if(req.currentUser){
    	res.render('replenishment');
    }else{
    	res.redirect('login');
    }
});

router.get('/warehouse', function(req, res) {
    if(req.currentUser){
    	res.render('warehouse');
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
