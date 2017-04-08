'use strict';
var router = require('express').Router();
var AV = require('leanengine');

router.get('/', function(req, res) {
    if(req.currentUser){
    	res.render('index');
    }else{
    	res.redirect('../login');
    }
});

router.get('/customer', function(req, res) {
    if(req.currentUser){
    	res.render('customer');
    }else{
    	res.redirect('../login');
    }
});

router.get('/product', function(req, res) {
    if(req.currentUser){
    	res.render('product');
    }else{
    	res.redirect('../login');
    }
});

router.get('/assortment', function(req, res) {
    if(req.currentUser){
    	res.render('assortment');
    }else{
    	res.redirect('../login');
    }
});

router.get('/admincard', function(req, res) {
    if(req.currentUser){
        res.render('admincard');
    }else{
    	res.redirect('../login');
    }
});

router.get('/box', function(req, res) {
    if(req.currentUser){
    	res.render('box');
    }else{
    	res.redirect('../login');
    }
});

router.get('/checklist', function(req, res) {
    if(req.currentUser){
    	res.render('checklist');
    }else{
    	res.redirect('../login');
    }
});

router.get('/checkrecord', function(req, res) {
    if(req.currentUser){
    	res.render('checkrecord');
    }else{
    	res.redirect('../login');
    }
});

router.get('/cusemp', function(req, res) {
    if(req.currentUser){
    	res.render('cusemp');
    }else{
    	res.redirect('../login');
    }
});

router.get('/empCard', function(req, res) {
    if(req.currentUser){
    	res.render('empcard');
    }else{
    	res.redirect('../login');
    }
});

router.get('/cusproduct', function(req, res) {
    if(req.currentUser){
    	res.render('cusproduct');
    }else{
    	res.redirect('../login');
    }
});

router.get('/emppower', function(req, res) {
    if(req.currentUser){
    	res.render('emppower');
    }else{
    	res.redirect('../login');
    }
});

router.get('/passtock', function(req, res) {
    if(req.currentUser){
    	res.render('passtock');
    }else{
    	res.redirect('../login');
    }
});

router.get('/pasrecord', function(req, res) {
    if(req.currentUser){
    	res.render('pasrecord');
    }else{
    	res.redirect('../login');
    }
});

router.get('/supply', function(req, res) {
    if(req.currentUser){
    	res.render('supply');
    }else{
    	res.redirect('../login');
    }
});

router.get('/supplyplan', function(req, res) {
    if(req.currentUser){
    	res.render('supplyplan');
    }else{
    	res.redirect('../login');
    }
});

router.get('/warehouse', function(req, res) {
    if(req.currentUser){
    	res.render('warehouse');
    }else{
    	res.redirect('../login');
    }
});

router.get('/summary', function(req, res) {
    if(req.currentUser){
    	res.render('summary');
    }else{
    	res.redirect('../login');
    }
});

router.get('/morris', function(req, res) {
    if(req.currentUser){
    	res.render('morris');
    }else{
    	res.redirect('../login');
    }
});

router.get('/empimport', function(req, res) {
    if(req.currentUser){
        let cusQuery=new AV.Query('Customer');
        cusQuery.equalTo('isDel',false);
        cusQuery.find().then(function(results){
            res.render('empimport',{"results":results});
        });
    }else{
    	res.redirect('../login');
    }
});
module.exports = router;
