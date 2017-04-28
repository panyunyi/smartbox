'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var async = require('async');

router.get('/', function(req, res) {
    let empQuery=new AV.Query('Employee');
    empQuery.equalTo('isDel',false);
    empQuery.limit(1000);
    empQuery.find().then(function(emps){
        let powerQuery=new AV.Query('EmployeePower');
        powerQuery.equalTo('isDel',false);
        powerQuery.count().then(function(count){
            let num=Math.ceil(count/1000);
            let powerArr=[];
            async.times(num,function(n,callback1){
                powerQuery.limit(1000);
                powerQuery.skip(n*1000);
                powerQuery.find().then(function(powers){
                    powerArr=powerArr.concat(powers);
                    callback1(null,1);
                });
            },function(err,timesres){
                async.map(emps,function(emp,callback2){
                    let emppower=[];
                    async.map(powerArr,function(power,callback3){
                        if(power.get('emp').id==emp.id){
                            emppower.push(power);
                        }
                        callback3(null,1);
                    },function(err,powerres){
                        let one={"name":emp.get('name'),"empNo":emp.get('empNo'),
                        "dept":emp.get('dept'),"power":emppower};
                        callback2(null,one);
                    });
                },function(err,empsres){
                    res.jsonp(empsres);
                });
            });
        });
    });
});
// router.get('/', function(req, res) {
//     let query=new AV.Query('TakeOut');
//     query.include('card');
//     query.include('passage');
//     query.count().then(function(count){
//         let num=Math.ceil(count/1000);
//         async.times(num,function(n,callback){
//             query.limit(1000);
//             query.skip(1000*n);
//             query.find().then(function(takes){
//                 async.map(takes,function(take,callback1){
//                     take.set('cardNo',take.get('card').get('card'));
//                 },function(err,takeres){

//                 });
//             });
//         },function(err,results){

//         });
//     });
// });

// router.get('/', function(req, res) {
//     let query=new AV.Query('EmployeeCard');
//     query.equalTo('isDel',false);
//     let time=new Date('2017-04-14 23:00:00');
//     query.greaterThan('createdAt',time);
//     query.limit(1000);
//     query.find().then(function(cards){
//         async.map(cards,function(card,callback){
//             let num=card.get('card')*1;
//             //console.log(PrefixInteger(num.toString(16),6));
//             card.set('card',PrefixInteger(num.toString(16),6));
//             callback(null,card);
//         },function(err,results){
//             AV.Object.saveAll(results).then(function (results) {
//             // 成功
//                 res.jsonp(results.length);
//             }, function (error) {
//             // 异常处理
//             });
//             console.log(results.length);

//         });
//     });
// });

/*
router.get('/', function(req, res) {
    let query=new AV.Query('EmployeePower');
    query.count().then(function(count){
        let num=Math.ceil(count/1000);
        let emps=[];
        async.times(num,function(n,callback){
            query.limit(1000);
            query.skip(1000*n);
            query.find().then(function(results){
                async.map(results,function(result,callback1){
                    if(result.get('unit')=="day"&&result.get('period')==7){
                        result.set('unit','week');
                        result.set('period',1);
                        emps.push(result);
                    }
                    callback1(null,result);
                },function(err,arr){
                    callback(null,arr);
                });
            });
        },function(err,empsres){
            //console.log(emps.length);
            AV.Object.saveAll(emps).then(function (results) {
            // 成功
                res.jsonp(results.length);
            }, function (error) {
            // 异常处理
            });
        });
    });
});
*/

function PrefixInteger(num, n) {
    var len = num.toString().length;
    while(len < n) {
        num = "0" + num;
        len++;
    }
    return num;
}
module.exports = router;
