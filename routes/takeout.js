'use strict';
var router = require('express').Router();
var ApiLog = require('./log');
var AV = require('leanengine');
var async = require('async');
var moment = require('moment');
var TakeOut = AV.Object.extend('TakeOut');
function checkTakeoutToday(emp,product){//2018-11-13 判断当日领取次数
    return new Promise((resolve,reject)=>{
        let takeoutQuery = new AV.Query('TakeOut');
        takeoutQuery.equalTo('isDel', false);
        takeoutQuery.equalTo('result', true);
        takeoutQuery.equalTo('emp', emp);
        takeoutQuery.equalTo('product', product);
        takeoutQuery.greaterThanOrEqualTo('time', moment().startOf('day').toDate());
        takeoutQuery.lessThanOrEqualTo('time', new Date());
        //console.log(moment().startOf('day').toDate());
        //console.log(moment().endOf("day").toDate());
        takeoutQuery.count().then(function (count) {
            //console.log(count);
            resolve({count});
        });
    })
  }
function doWork(cus, box, deviceId, card, passage, res, getCount) {
    let flag = false;
    let resdata = {};
    let message = "无权限";
    resdata["result"] = flag;
    let onetake = new TakeOut();
    let dayLimit=cus.get('dayLimit');//2018-11-13加入每日限制领取次数
    //console.log("daylimit:"+dayLimit);
    function promise1(callback) {
        let cardQuery = new AV.Query('EmployeeCard');
        let num = card * 1;
        //console.log(num);
        let tempCard = PrefixInteger(num.toString(16), 6);
        //console.log(tempCard);
        if (typeof (cus) == "undefined") {
            message = "此公司未找到";
            return callback(error);
        }
        if (cus.get('flag') == 1) {//2017-08-13 艺康卡号后5位直接匹配
            //console.log(PrefixInteger(card.slice(3), 10));
            cardQuery.equalTo('oldCard', PrefixInteger(card.slice(3), 10));
        } else if(box.get('flag')==1){
            let tempcard=card.toLowerCase();
            //console.log(tempcard);
            cardQuery.contains('card', tempcard.length > 6 ? tempcard.slice(tempcard.length - 6) : tempcard);
        }else if(cus.get('flag')==3){
            let tempcard=card.toLowerCase();
            cardQuery.equalTo('card',tempcard.slice(2));
        }
        else {
            cardQuery.contains('card', tempCard.length > 6 ? tempCard.slice(tempCard.length - 6) : tempCard);
        }
        //console.log(tempCard.length > 6 ? tempCard.slice(tempCard.length - 6) : tempCard);
        cardQuery.equalTo('cusId', cus);
        cardQuery.equalTo('isDel', false);
        cardQuery.include('emp');
        cardQuery.first().then(function (cardObj) {
            // console.log(tempCard.slice(tempCard.length-6));
            // console.log(cardObj.id);
            if (typeof (cardObj) == "undefined") {
                let admincardQuery = new AV.Query('AdminCard');
                admincardQuery.equalTo('isDel', false);
                admincardQuery.equalTo('card', card);
                admincardQuery.equalTo('box', box.id);
                admincardQuery.count().then(function (count) {
                    if (count > 0) {
                        message = "管理卡取货成功";
                        resdata["result"] = true;
                        resdata["objectId"] = "123";
                        let result = {
                            status: 200,
                            message: message,
                            data: resdata,

                            server_time: new Date()
                        }
                        return res.jsonp(result);
                    } else {
                        message = card + "卡号未找到";
                        return callback(null, 0, null);
                    }
                });
            } else {
                if(cardObj.get('emp').get('dept')=="TDS"){
                        message = "权限已停用";
                        return callback(null, 0, null);
                }else{
                    onetake.set('isDel', false);
                    onetake.set('box', box);
                    onetake.set('time', new Date());
                    onetake.set('card', cardObj);
                    if (cardObj.get('oldCard') == null) {
                        cardObj.set('oldCard', PrefixInteger(card, 10));
                        cardObj.save();
                    }
                    onetake.set('cardNo', card);
                    onetake.set('result', false);
                    //onetake.set('count', getCount * 1);
                    onetake.set('emp', cardObj.get('emp'));
                    onetake.save();
                    return callback(null, 1, cardObj.get('emp'));
                }
            }
        }, function (error) {
            message = "卡号异常";
            return callback(error);
        });
    }
    function promise2(arg1, emp, callback) {
        if (arg1 == 0) {
            return callback(null, false, null);
        }
        let passageQuery = new AV.Query('Passage');
        passageQuery.equalTo('isDel', false);
        passageQuery.equalTo('isSend', true);
        passageQuery.include('product');
        if (passage.length == 3) {
            //console.log(passage);
            passageQuery.equalTo('flag', passage.substr(0, 1));
            passageQuery.equalTo('seqNo', passage.substr(1, 2));
        } else {
            passageQuery.equalTo('seqNo', passage);
            passageQuery.equalTo('flag', '');
        }
        passageQuery.equalTo('boxId', box);
        passageQuery.first().then(function (passageObj) {
            if (passage.length == 3) {
                getCount = passageObj.get('capacity');
            }
            onetake.set('count', getCount * 1);//2018-7-26 格子柜领取记录问题：格子柜的领取数量按照格子柜容量
            onetake.set('passage', passageObj);
            onetake.set('passageNo', passage);
            onetake.set('product', passageObj.get('product'));
            onetake.save().then(function () {
                //console.log(passageObj.get('product').id);
                return callback(null, passageObj, emp);
            });
        }, function (error) {
            message = "货道异常";
            return callback(error);
        });
    }
    function promise3(passageObj, emp, callback) {
        if (typeof (passageObj) == "undefined" || passageObj == false || emp == null) {
            return callback(null, false);
        }
        let product = passageObj.get('product');
        let powerQuery = new AV.Query('EmployeePower');
        powerQuery.equalTo('isDel', false);
        powerQuery.equalTo('product', product);
        powerQuery.equalTo('emp', emp);
        powerQuery.first().then(function (power) {
            if (emp.get('super') > 0) {
                onetake.set('result', true);
                onetake.save().then(function (one) {
                    flag = true;
                    message = "成功";
                    resdata["result"] = flag;
                    resdata["objectId"] = one.id;
                    let passagedata = onetake.get('passage');
                    passagedata.increment('stock', -getCount);
                    passagedata.save().then(function () {
                        callback(null, true);
                    });
                });
            } else if (typeof (power) != "undefined") {
                verifyPower(emp, power, product, getCount, callback);
            } else {
                message = "无取货权限";
                return callback(null, false);
            }
        });
    }
    async function verifyPower(emp, power, product, getCount, callback) {
        if(dayLimit>0&&getCount>1){//2018-11-13 若有每日限领次数，那么禁止一天一次取货多个
            message = product.get('name') +"每日只可领取1个。";
            resdata["result"] = flag;
            return callback(null, false);
        }
        let todayCheck=await checkTakeoutToday(emp,product);
        //console.log("today:"+JSON.stringify(todayCheck["count"]));
        let todayTakeout=todayCheck["count"];
        if(todayTakeout>=dayLimit&&dayLimit>0){//2018-11-13 若有每日限领次数，那么禁止一天多次取货
            message = "今日已取" + product.get('name') + "："+todayTakeout+"次，请明日再领。每日只可领取1次,每次1个。";
            resdata["result"] = flag;
            return callback(null, false);
        }
        let unit = power.get('unit');
        let period = power.get('period');
        let count = power.get('count');
        let units;
        switch (unit) {
            case "month":
                units = "months";
                break;
            case "day":
                units = "days";
                break;
            case "week":
                units = "weeks";
                break;
            default:
                units = "days";
        }
        let begin = moment().subtract(period - 1, units).startOf(unit);
        let takeoutQuery = new AV.Query('TakeOut');
        takeoutQuery.equalTo('isDel', false);
        takeoutQuery.equalTo('result', true);
        takeoutQuery.equalTo('emp', emp);
        takeoutQuery.equalTo('product', product);
        takeoutQuery.limit(1000);
        takeoutQuery.greaterThanOrEqualTo('time', begin.toDate());
        takeoutQuery.lessThanOrEqualTo('time', new Date());
        takeoutQuery.find().then(function (takeouts) {
            let takecount = 0;
            //console.log(takeouts.length);
            async.map(takeouts, function (tk, callback1) {
                takecount += tk.get('count');
                callback1(null, 1);
            }, function (err, tks) {
                //console.log(takecount);
                power.set('used', takecount);
                takecount = takecount * 1 + getCount * 1;
                if (count >= takecount) {
                    flag = true;
                    onetake.set('result', true);
                    onetake.save().then(function (one) {
                        message = "成功";
                        resdata["result"] = flag;
                        resdata["objectId"] = one.id;
                        let passagedata = onetake.get('passage');
                        passagedata.increment('stock', -getCount);
                        power.increment('used', getCount);
                        power.save();
                        passagedata.save().then(function () {
                            callback(null, true);
                        });
                    });
                } else {
                    message = "已取" + product.get('name') + "：" + (takecount - getCount * 1) + "次，超过领取次数。此次领取数量为：" + getCount;
                    resdata["result"] = flag;
                    callback(null, false);
                }
            });
        });
    }
    async.waterfall([
        function (callback) {
            promise1(callback);
        },
        function (arg1, arg2, callback) {
            promise2(arg1, arg2, callback);
        },
        function (arg1, arg2, callback) {
            promise3(arg1, arg2, callback);
        }], function (err, results) {
            let result = {
                status: 200,
                message: message,
                data: resdata,
                server_time: new Date()
            }
            res.jsonp(result);
        });
}

router.get('/:id/:card/:passage/:count', function (req, res) {
    let deviceId = req.params.id;
    let card = req.params.card;
    let passage = req.params.passage;
    let count = req.params.count;
    let todo = { "ip": req.headers['x-real-ip'], "api": "多次取货判断接口", "deviceId": deviceId, "msg": "card:" + card + ",passage:" + passage + ",count:" + count };
    ApiLog.WorkOn(todo);
    let boxQuery = new AV.Query('BoxInfo');
    boxQuery.equalTo('deviceId', deviceId);
    boxQuery.include('cusId');
    boxQuery.first().then(function (box) {
        if (typeof (box) == "undefined") {
            let result = {
                status: 200,
                message: "无此设备号的数据",
                data: { "result": false },
                server_time: new Date()
            }
            res.jsonp(result);
            return;
        }
        let cus = box.get('cusId');
        doWork(cus, box, deviceId, card, passage, res, count * 1);
    }, function (error) {
        console.log(error);
        let result = {
            status: 200,
            message: "查询出错",
            data: { "result": false },
            server_time: new Date()
        }
        res.jsonp(result);
    });
});

router.get('/:id/:card/:passage', function (req, res) {
    let deviceId = req.params.id;
    let card = req.params.card;
    let passage = req.params.passage;
    let todo = { "ip": req.headers['x-real-ip'], "api": "取货判断接口", "deviceId": deviceId, "msg": "card:" + card + ",passage:" + passage };
    ApiLog.WorkOn(todo);
    let boxQuery = new AV.Query('BoxInfo');
    boxQuery.equalTo('deviceId', deviceId);
    boxQuery.include('cusId');
    boxQuery.first().then(function (box) {
        if (typeof (box) == "undefined") {
            let result = {
                status: 200,
                message: "无此设备号的数据",
                data: { "result": false },
                server_time: new Date()
            }
            res.jsonp(result);
            return;
        }
        let cus = box.get('cusId');
        doWork(cus, box, deviceId, card, passage, res, 1);
    }, function (error) {
        console.log(error);
        let result = {
            status: 200,
            message: "查询出错",
            data: { "result": false },
            server_time: new Date()
        }
        res.jsonp(result);
    });
});

router.get('/fail/:id', function (req, res) {
    let result = {
        status: 200,
        message: "objectId有误",
        data: false,
        server_time: new Date()
    }
    let todo = { "ip": req.headers['x-real-ip'], "api": "取货失败回调接口", "deviceId": "", "msg": "objectId:" + req.params.id };
    ApiLog.WorkOn(todo);
    let takeout = AV.Object.createWithoutData('TakeOut', req.params.id);
    takeout.fetch().then(function () {
        let flag = takeout.get('result');
        if (flag) {
            takeout.set('result', false);
            takeout.save();
            result['message'] = "";
            result['data'] = true;
            res.jsonp(result);
            let passage = takeout.get('passage');
            passage.increment('stock', takeout.get('count'));
            passage.save();
        } else {
            result['message'] = "操作已回滚";
            res.jsonp(result);
        }
    }, function (error) {
        res.jsonp(result);
    });
});
function PrefixInteger(num, n) {
    var len = num.toString().length;
    while (len < n) {
        num = "0" + num;
        len++;
    }
    return num;
}
module.exports = router;
