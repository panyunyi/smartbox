'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var async = require('async');

router.get('/', function(req, res) {
    var AdminCard=AV.Object.createWithoutData('AdminCard','5830509ca22b9d006b83b7c8');
    /*var box=AV.Object.createWithoutData('BoxInfo','58304572a22b9d006b833962');
    var boxarray=[box];
    AdminCard.addUnique('box',boxarray);
    AdminCard.save();*/
    AdminCard.fetch({include:['box']},null).then(function (results){
        res.json({data:results});
    });

});
module.exports = router;
