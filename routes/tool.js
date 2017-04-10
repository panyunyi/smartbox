'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var async = require('async');

router.get('/', function(req, res) {
    let query=new AV.Query('EmployeeCard');
    query.equalTo('isDel',false);
    query.limit(1000);
    query.find().then(function(cards){
        async.map(cards,function(card,callback){
            let num=card.get('card')*1;
            //console.log(PrefixInteger(num.toString(16),6));
            card.set('card',PrefixInteger(num.toString(16),6));
            callback(null,card);
        },function(err,results){
            AV.Object.saveAll(results).then(function (results) {
            // 成功
                res.jsonp(results.length);
            }, function (error) {
            // 异常处理
            });
            console.log(results.length);

        });
    });
});
function PrefixInteger(num, n) {
    return (Array(n).join(0) + num).slice(-n);
}
module.exports = router;
