'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var async = require('async');
var ApiLog=require('./log');

router.get('/admincard', function(req, res) {
    var query=new AV.Query('AdminCard');
    query.find().then(function (results){
        var data=[];
        results.forEach(function(result){
            var one={"card":result.get('card'),"box":result.get('box'),"customer":result.get('customer')};
            data.push(one);
        });
        res.jsonp({"data":data});
    });
});

module.exports = router;
