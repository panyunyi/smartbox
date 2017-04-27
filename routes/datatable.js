'use strict';
var router = require('express').Router();
var AV = require('leanengine');
var async = require('async');
var ApiLog=require('./log');
var moment=require('moment');

//管理卡
router.get('/admincard', function(req, res) {
    let resdata={};
    function promise1(callback){
        let query=new AV.Query('AdminCard');
        query.equalTo('isDel',false);
        query.find().then(function (results){
            let jsondata=[];
            async.map(results,function(result,callback1){
            	async.map(result.get('box'),function(boxId,callback2){
            		let box=AV.Object.createWithoutData('BoxInfo',boxId);
            		box.fetch().then(function(data){
                        let boxdata={};
                        boxdata['id']=data.id;
                        boxdata['name']=data.get('machine');
            			callback2(null,boxdata);
            		});
            	},function(err,boxes){
               		let one={"DT_RowId":result.id,"card":result.get('card'),
                    "box":boxes,"notice":result.get('notice')?result.get('notice'):""};
                	jsondata.push(one);
                	callback1(null,boxes);
            	});
            },function(err,results2){
                resdata["data"]=jsondata;
                callback(null,jsondata);
            });
        });
    }
    function promise2(callback){
        let query=new AV.Query('BoxInfo');
        query.equalTo('isDel',false);
        query.find().then(function(results){
            async.map(results,function(result,callback1){
                result.set('label',result.get('machine'));
                result.set('value',result.id);
                callback1(null,result);
            },function(err,data){
                data={"box[].id":data};
                resdata["options"]=data;
                callback(null,data);
            });
        });
    }
    async.parallel([
        function (callback){
            promise1(callback);
        },
        function (callback){
            promise2(callback);
        }],function(err,results){
            res.jsonp(resdata);
    });
});
//增加管理卡
var AdminCard = AV.Object.extend('AdminCard');
router.post('/admincard/add',function(req,res){
    let arr=req.body;
    let admincard=new AdminCard();
    let box=[];
    let boxarr=[];
    admincard.set('card',arr['data[0][card]']);
    admincard.set('notice',arr['data[0][notice]']);
    async.times(arr['data[0][box-many-count]']*1,function(i,callback){
        let boxdata={};
        box.push(arr['data[0][box]['+i+'][id]']);
        boxdata['id']=arr['data[0][box]['+i+'][id]'];
        let boxObj=AV.Object.createWithoutData('BoxInfo', arr['data[0][box]['+i+'][id]']);
        boxObj.fetch().then(function(){
            boxdata['name']=boxObj.get('machine');
            boxarr.push(boxdata);
            callback(null,boxdata);
        });
    },function(err,results){
        admincard.set('box',box);
        admincard.save().then(function(ac){
            let data=[];
            ac.set('DT_RowId',ac.id);
            ac.set('box',boxarr);
            data.push(ac);
            res.jsonp({"data":data});
        });
    });
});
//更新管理卡
router.put('/admincard/edit/:id',function(req,res){
    let arr=req.body;
    let id=req.params.id;
    let admincard = AV.Object.createWithoutData('AdminCard', id);
    let box=[];
    let boxarr=[];
    admincard.set('card',arr['data['+id+'][card]']);
    admincard.set('notice',arr['data['+id+'][notice]']);
    async.times(arr['data['+id+'][box-many-count]']*1,function(i,callback){
        let boxdata={};
        box.push(arr['data['+id+'][box]['+i+'][id]']);
        boxdata['id']=arr['data['+id+'][box]['+i+'][id]'];
        let boxObj=AV.Object.createWithoutData('BoxInfo', arr['data['+id+'][box]['+i+'][id]']);
        boxObj.fetch().then(function(){
            boxdata['name']=boxObj.get('machine');
            boxarr.push(boxdata);
            callback(null,boxdata);
        });
    },function(err,results){
        admincard.set('box',box);
        admincard.save().then(function(ac){
            let data=[];
            ac.set('DT_RowId',ac.id);
            ac.set('box',boxarr);
            data.push(ac);
            res.jsonp({"data":data});
        });
    });
});
//删除管理卡
router.delete('/admincard/remove/:id',function(req,res){
    let id=req.params.id;
    let admincard = AV.Object.createWithoutData('AdminCard', id);
    admincard.set('isDel',true);
    admincard.save().then(function(){
        res.jsonp({"data":[]});
    });
});
//客户
router.get('/customer',function(req,res){
    let query=new AV.Query('Customer');
    query.equalTo('isDel',false);
    query.find().then(function(results){
        async.map(results,function(result,callback){
            result.set('DT_RowId',result.id);
            result.set('name',result.get('name')?result.get('name'):"");
            result.set('connecter',result.get('connecter')?result.get('connecter'):"");
            result.set('connectPhone',result.get('connectPhone')?result.get('connectPhone'):"");
            result.set('province',result.get('province')?result.get('province'):"");
            result.set('city',result.get('city')?result.get('city'):"");
            result.set('area',result.get('area')?result.get('area'):"");
            result.set('address',result.get('address')?result.get('address'):"");
            callback(null,result);
        },function(err,data){
            res.jsonp({"data":data});
        });
    });
});
//增加客户
var Customer = AV.Object.extend('Customer');
router.post('/customer/add',function(req,res){
    let arr=req.body;
    let customer=new Customer();
    customer.set('name',arr['data[0][name]']);
    customer.set('connecter',arr['data[0][connecter]']);
    customer.set('connectPhone',arr['data[0][connectPhone]']);
    customer.set('province',arr['data[0][province]']);
    customer.set('city',arr['data[0][city]']);
    customer.set('area',arr['data[0][area]']);
    customer.set('address',arr['data[0][address]']);
    customer.set('isDel',false);
    customer.save().then(function(cus){
        let data=[];
        cus.set('DT_RowId',cus.id);
        data.push(cus);
        res.jsonp({"data":data});
    });
});
//更新客户资料
router.put('/customer/edit/:id',function(req,res){
    let arr=req.body;
    let id=req.params.id;
    let customer = AV.Object.createWithoutData('Customer', id);
    customer.set('name',arr['data['+id+'][name]']);
    customer.set('connecter',arr['data['+id+'][connecter]']);
    customer.set('connectPhone',arr['data['+id+'][connectPhone]']);
    customer.set('province',arr['data['+id+'][province]']);
    customer.set('city',arr['data['+id+'][city]']);
    customer.set('area',arr['data['+id+'][area]']);
    customer.set('address',arr['data['+id+'][address]']);
    customer.save().then(function(cus){
        let data=[];
        cus.set('DT_RowId',cus.id);
        data.push(cus);
        res.jsonp({"data":data});
    });
});
//删除客户资料
router.delete('/customer/remove/:id',function(req,res){
    let id=req.params.id;
    let customer = AV.Object.createWithoutData('Customer', id);
    customer.set('isDel',true);
    customer.save().then(function(){
        res.jsonp({"data":[]});
    });
});
//产品
router.get('/product',function(req,res){
    let resdata={};
    function promise1(callback1){
        let query=new AV.Query('Product');
        query.equalTo('isDel',false);
        query.include('type');
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('DT_RowId',result.id);
                result.set('assort',result.get('type').id);
                result.set('type',result.get('type')?result.get('type').get('name'):"");
                result.set('price',result.get('price'));
                result.set('spec',result.get('spec')?result.get('spec'):"");
                result.set('sku',result.get('sku')?result.get('sku'):"");
                callback(null,result);
            },function(err,data){
                resdata["data"]=data;
                callback1(null,data);
            });
        });
    }
    function promise2(callback1){
        let query=new AV.Query('Assortment');
        query.equalTo('isDel',false);
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('label',result.get('name'));
                result.set('value',result.id);
                callback(null,result);
            },function(err,data){
                data={"assort":data};
                resdata["options"]=data;
                callback1(null,data);
            });
        });
    }
    async.parallel([
        function (callback){
            promise1(callback);
        },
        function (callback){
            promise2(callback);
        }],function(err,results){
            res.jsonp(resdata);
    });
});
//增加产品
var Product = AV.Object.extend('Product');
router.post('/product/add',function(req,res){
    let arr=req.body;
    let product=new Product();
    let productQuery=new AV.Query('Product');
    productQuery.equalTo('isDel',false);
    productQuery.equalTo('sku',arr['data[0][sku]']);
    productQuery.count().then(function(count){
        if(count>0){
            return res.jsonp({"data":[],"fieldErrors":[{"name":"sku","status":arr['data[0][sku]']+"已存在"}]});
        }else{
            product.set('name',arr['data[0][name]']);
            product.set('unit',arr['data[0][unit]']);
            let type=AV.Object.createWithoutData('Assortment', arr['data[0][assort]']);
            product.set('type',type);
            product.set('stockDays',arr['data[0][stockDays]']?arr['data[0][stockDays]']*1:1);
            product.set('spec',arr['data[0][spec]']);
            product.set('cue',arr['data[0][cue]']?arr['data[0][cue]']*1:0);
            product.set('price',arr['data[0][price]']?arr['data[0][price]']*1:0);
            product.set('warning',arr['data[0][warning]']?arr['data[0][warning]']*1:0);
            product.set('sku',arr['data[0][sku]'].trim());
            product.set('oldsku',arr['data[0][oldsku]']);
            product.set('isDel',false);
            product.save().then(function(pro){
                let data=[];
                pro.set('DT_RowId',pro.id);
                pro.set('typeId',pro.get('type').id);
                pro.set('price',pro.get('price'));
                pro.set('spec',pro.get('spec')?pro.get('spec'):"");
                type.fetch().then(function(){
                    pro.set('type',type.get('name'));
                    data.push(pro);
                    res.jsonp({"data":data});
                });
            },function(error){
                console.log(error);
            });
        }
    });

});
//更新产品资料
router.put('/product/edit/:id',function(req,res){
    let arr=req.body;
    let id=req.params.id;
    let product = AV.Object.createWithoutData('Product', id);
    product.fetch().then(function(){
        if(product.get('sku')==arr['data['+id+'][sku]'].trim()){
            product.set('name',arr['data['+id+'][name]']);
            product.set('unit',arr['data['+id+'][unit]']);
            let type=AV.Object.createWithoutData('Assortment', arr['data['+id+'][assort]']);
            product.set('type',type);
            product.set('stockDays',arr['data['+id+'][stockDays]']*1);
            product.set('spec',arr['data['+id+'][spec]']);
            product.set('cue',arr['data['+id+'][cue]']*1);
            product.set('price',arr['data['+id+'][price]']*1);
            product.set('warning',arr['data['+id+'][warning]']*1);
            product.set('isDel',false);
            product.save().then(function(pro){
                let data=[];
                pro.set('DT_RowId',pro.id);
                pro.set('typeId',pro.get('type').id);
                pro.set('price',pro.get('price'));
                pro.set('spec',pro.get('spec')?pro.get('spec'):"");
                type.fetch().then(function(){
                    pro.set('type',type.get('name'));
                    data.push(pro);
                    res.jsonp({"data":data});
                });
            },function(err){
                console.log(err);
            });
        }else{
            let productQuery=new AV.Query('Product');
            productQuery.equalTo('isDel',false);
            productQuery.equalTo('sku',arr['data['+id+'][sku]']);
            productQuery.count().then(function(count){
                if(count>0){
                    return res.jsonp({"data":[],"fieldErrors":[{"name":"sku","status":arr['data['+id+'][sku]']+"已存在"}]});
                }else{
                    product.set('name',arr['data['+id+'][name]']);
                    product.set('unit',arr['data['+id+'][unit]']);
                    let type=AV.Object.createWithoutData('Assortment', arr['data['+id+'][assort]']);
                    product.set('type',type);
                    product.set('stockDays',arr['data['+id+'][stockDays]']*1);
                    product.set('spec',arr['data['+id+'][spec]']);
                    product.set('cue',arr['data['+id+'][cue]']*1);
                    product.set('price',arr['data['+id+'][price]']*1);
                    product.set('warning',arr['data['+id+'][warning]']*1);
                    product.set('sku',arr['data['+id+'][sku]'].trim());
                    product.set('isDel',false);
                    product.save().then(function(pro){
                        let data=[];
                        pro.set('DT_RowId',pro.id);
                        pro.set('typeId',pro.get('type').id);
                        pro.set('price',pro.get('price'));
                        pro.set('spec',pro.get('spec')?pro.get('spec'):"");
                        type.fetch().then(function(){
                            pro.set('type',type.get('name'));
                            data.push(pro);
                            res.jsonp({"data":data});
                        });
                    },function(err){
                        console.log(err);
                    });
                }
            });
        }
    });
});
//删除产品
router.delete('/product/remove/:id',function(req,res){
    let id=req.params.id;
    let product = AV.Object.createWithoutData('Product', id);
    product.set('isDel',true);
    product.save().then(function(){
        res.jsonp({"data":[]});
    });
});
//产品分类
router.get('/category',function(req,res){
    let query=new AV.Query('Assortment');
    query.equalTo('isDel',false);
    query.find().then(function(results){
        results.forEach(function(result){
            result.set('DT_RowId',result.id);
        });
        res.jsonp({"data":results});
    });
});
//增加产品分类
var Assortment = AV.Object.extend('Assortment');
router.post('/category/add',function(req,res){
    let arr=req.body;
    let assortment=new Assortment();
    assortment.set('name',arr['data[0][name]']);
    assortment.set('isDel',false);
    assortment.save().then(function(ass){
        let data=[];
        ass.set('DT_RowId',ass.id);
        data.push(ass);
        res.jsonp({"data":data});
    });
});
//更新产品分类
router.put('/category/edit/:id',function(req,res){
    let arr=req.body;
    let id=req.params.id;
    let assortment = AV.Object.createWithoutData('Assortment', id);
    assortment.set('name',arr['data['+id+'][name]']);
    assortment.save().then(function(ass){
        let data=[];
        ass.set('DT_RowId',ass.id);
        data.push(ass);
        res.jsonp({"data":data});
    });
});
//删除产品分类
router.delete('/category/remove/:id',function(req,res){
    let id=req.params.id;
    let assortment = AV.Object.createWithoutData('Assortment', id);
    assortment.set('isDel',true);
    assortment.save().then(function(){
        res.jsonp({"data":[]});
    });
});
//客户产品管理
router.get('/customerProduct',function(req,res){
    let resdata={};
    function promise1(callback1){
        let query=new AV.Query('CustomerProduct');
        query.equalTo('isDel',false);
        query.include('product');
        query.include('cusId');
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('DT_RowId',result.id);
                result.set('sku',result.get('product').get('sku'));
                result.set('productId',result.get('product').id);
                result.set('product',result.get('product').get('name'));
                result.set('cus',result.get('cusId').get('name'));
                result.set('cusId',result.get('cusId').id);
                callback(null,result);
            },function(err,data){
                resdata["data"]=data;
                callback1(null,data);
            });
        });
    }
    function promise2(callback1){
        let query=new AV.Query('Customer');
        query.equalTo('isDel',false);
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('label',result.get('name'));
                result.set('value',result.id);
                callback(null,result);
            },function(err,data){
                callback1(null,data);
            });
        });
    }
    function promise3(callback1){
        let query=new AV.Query('Product');
        query.equalTo('isDel',false);
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('label',result.get('sku')+" "+result.get('name'));
                result.set('value',result.id);
                callback(null,result);
            },function(err,data){
                callback1(null,data);
            });
        });
    }
    async.parallel([
        function (callback){
            promise1(callback);
        },
        function (callback){
            promise2(callback);
        },
        function (callback){
            promise3(callback);
        }],function(err,results){
            resdata["options"]=Object.assign({"cusId":results[1]},{"productId":results[2]});
            res.jsonp(resdata);
    });
});
//增加客户产品
var CusProduct = AV.Object.extend('CustomerProduct');
router.post('/cusproduct/add',function(req,res){
    let arr=req.body;
    let product=new CusProduct();
    product.set('cusProductPrice',arr['data[0][cusProductPrice]']*1);
    let proobj=AV.Object.createWithoutData('Product', arr['data[0][productId]']);
    product.set('product',proobj);
    let cus=AV.Object.createWithoutData('Customer', arr['data[0][cusId]']);
    product.set('cusId',cus);
    product.set('isDel',false);
    product.save().then(function(pro){
        let data=[];
        pro.set('DT_RowId',pro.id);
        pro.set('cusId',pro.get('cusId').id);
        pro.set('productId',pro.get('product').id);
        proobj.fetch().then(function(){
            pro.set('product',proobj.get('name'));
            pro.set('sku',proobj.get('sku'));
            cus.fetch().then(function(){
                pro.set('cus',cus.get('name'));
                data.push(pro);
                res.jsonp({"data":data});
            });
        });
    },function(error){
        console.log(error);
    });
});
//更新客户产品资料
router.put('/cusproduct/edit/:id',function(req,res){
    let arr=req.body;
    let id=req.params.id;
    let product = AV.Object.createWithoutData('CustomerProduct', id);
    product.set('cusProductPrice',arr['data['+id+'][cusProductPrice]']*1);
    let proobj=AV.Object.createWithoutData('Product', arr['data['+id+'][productId]']);
    product.set('product',proobj);
    let cus=AV.Object.createWithoutData('Customer', arr['data['+id+'][cusId]']);
    product.set('cusId',cus);
    product.set('isDel',false);
    product.save().then(function(pro){
        let data=[];
        pro.set('DT_RowId',pro.id);
        pro.set('cusId',pro.get('cusId').id);
        pro.set('productId',pro.get('product').id);
        proobj.fetch().then(function(){
            pro.set('product',proobj.get('name'));
            pro.set('sku',proobj.get('sku'));
            cus.fetch().then(function(){
                pro.set('cus',cus.get('name'));
                data.push(pro);
                res.jsonp({"data":data});
            });
        });
    },function(error){
        console.log(error);
    });
});
//删除客户产品
router.delete('/cusproduct/remove/:id',function(req,res){
    let id=req.params.id;
    let cusproduct = AV.Object.createWithoutData('CustomerProduct', id);
    cusproduct.set('isDel',true);
    cusproduct.save().then(function(){
        res.jsonp({"data":[]});
    });
});

//客户员工
router.get('/employee',function(req,res){
    let resdata={};
    function promise1(callback){
        let query=new AV.Query('EmployeeCard');
        query.include('emp');
        query.include('cusId');
        query.equalTo('isDel',false);
        query.count().then(function(count){
            let num=Math.ceil(count/1000);
            let emps=[];
            async.times(num,function(n,callback2){
                query.descending('createdAt');
                query.limit(1000);
                query.skip(1000*n);
                query.find().then(function(results){
                    emps=emps.concat(results);
                    callback2(null,results);
                });
            },function(err,empsres){
                async.map(emps,function(result,callback1){
                    result.set('DT_RowId',result.get('emp').id);
                    result.set('sex',result.get('emp').get('sex'));
                    result.set('cus',result.get('cusId').get('name'));
                    result.set('cusId',result.get('cusId').id);
                    result.set('job',result.get('emp').get('job')?result.get('emp').get('job'):"");
                    result.set('phone',result.get('emp').get('phone')?result.get('emp').get('phone'):"");
                    result.set('notice',result.get('emp').get('notice')?result.get('emp').get('notice'):"");
                    result.set('dept',result.get('emp').get('dept')?result.get('emp').get('dept'):"");
                    result.set('old',result.get('oldCard'));
                    result.set('empNo',result.get('emp').get('empNo'));
                    result.set('name',result.get('emp').get('name'));
                    result.set('super',result.get('emp').get('super'));
                    callback1(null,result);
                },function(err,data){
                    resdata["data"]=data;
                    callback(null,data);
                });
            });
        });
    }
    function promise2(callback1){
        let query=new AV.Query('Customer');
        query.equalTo('isDel',false);
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('label',result.get('name'));
                result.set('value',result.id);
                callback(null,result);
            },function(err,data){
                callback1(null,data);
            });
        });
    }
    async.parallel([
        function (callback){
            promise1(callback);
        },
        function (callback){
            promise2(callback);
        }],function(err,results){
            resdata["options"]=Object.assign({"cusId":results[1]});
            res.jsonp(resdata);
    });
});
//增加员工
var Employee = AV.Object.extend('Employee');
var EmpCard = AV.Object.extend('EmployeeCard');
router.post('/employee/add',function(req,res){
    let arr=req.body;
    let employee=new Employee();
    employee.set('empNo',arr['data[0][empNo]']);
    employee.set('name',arr['data[0][name]']);
    employee.set('sex',arr['data[0][sex]']*1);
    employee.set('job',arr['data[0][job]']);
    employee.set('phone',arr['data[0][phone]']);
    employee.set('dept',arr['data[0][dept]']);
    employee.set('notice',arr['data[0][notice]']);
    let unlimit=arr['data[0][super][]'];
    employee.set('super',unlimit?unlimit*1:0);
    let card=arr['data[0][old]'].trim();
    let cus=AV.Object.createWithoutData('Customer', arr['data[0][cusId]']);
    let empQuery=new AV.Query('Employee');
    empQuery.equalTo('isDel',false);
    empQuery.equalTo('cusId',cus);
    empQuery.equalTo('empNo',arr['data[0][empNo]']);
    empQuery.count().then(function(count){
        if(count>0){
            return res.jsonp({"data":[],"fieldErrors":[{"name":"empNo","status":"工号已存在"}]});
        }else {
            employee.set('cusId',cus);
            employee.set('isDel',false);
            employee.save().then(function(emp){
                let data=[];
                if(card!==null&&card!==undefined&&card!==''){
                    let cardQuery=new AV.Query('EmployeeCard');
                    cardQuery.equalTo('cusId',cus);
                    cardQuery.equalTo('isDel',false);
                    let num=card*1;
                    let tempCard=PrefixInteger(num.toString(16),6);
                    cardQuery.contains('card',tempCard.length>6?tempCard.slice(2):tempCard);
                    cardQuery.count().then(function(count){
                        if(count==0){
                            let cardObj=new EmpCard();
                            cardObj.set('cusId',cus);
                            cardObj.set('card',tempCard);
                            cardObj.set('emp',emp);
                            cardObj.set('oldCard',PrefixInteger(num,10));
                            cardObj.save();
                            emp.set('card',tempCard);
                            emp.set('old',PrefixInteger(num,10));
                            emp.set('DT_RowId',emp.id);
                            cus.fetch().then(function(){
                                emp.set('cus',cus.get('name'));
                                emp.set('cusId',cus.id);
                                data.push(emp);
                                res.jsonp({"data":data});
                            });
                        }else{
                            emp.destroy();
                            return res.jsonp({"data":[],"fieldErrors":[{"name":"old","status":"卡号已存在"}]});
                        }
                    });
                }else{
                    emp.destroy();
                    return res.jsonp({"data":[],"fieldErrors":[{"name":"old","status":"卡号填写不正确"}]});
                }
            },function(error){
                console.log(error);
            });
        }
    });

});
//更新员工'+id+'
router.put('/employee/edit/:id',function(req,res){
    let arr=req.body;
    let id=req.params.id;
    let employee = AV.Object.createWithoutData('Employee', id);
    let cus=AV.Object.createWithoutData('Customer', arr['data['+id+'][cusId]']);
    employee.fetch().then(function(){
        let empQuery=new AV.Query('Employee');
        empQuery.equalTo('isDel',false);
        empQuery.equalTo('cusId',cus);
        empQuery.equalTo('empNo',arr['data['+id+'][empNo]']);
        empQuery.count().then(function(count){
            if(count>0&&employee.get('empNo')!=arr['data['+id+'][empNo]']){
                return res.jsonp({"data":[],"fieldErrors":[{"name":"empNo","status":"工号已存在"}]});
            }else {
                employee.set('empNo',arr['data['+id+'][empNo]']);
                employee.set('name',arr['data['+id+'][name]']);
                employee.set('sex',arr['data['+id+'][sex]']*1);
                employee.set('job',arr['data['+id+'][job]']);
                employee.set('phone',arr['data['+id+'][phone]']);
                employee.set('dept',arr['data['+id+'][dept]']);
                employee.set('notice',arr['data['+id+'][notice]']);
                let unlimit=arr['data['+id+'][super][]'];
                employee.set('super',unlimit?unlimit*1:0);
                let card=arr['data['+id+'][old]'];
                employee.set('cusId',cus);
                employee.set('isDel',false);
                employee.save().then(function(emp){
                    let num=card*1;
                    let tempCard=PrefixInteger(num.toString(16),6);
                    let data=[];
                    let cardQuery=new AV.Query('EmployeeCard');
                    cardQuery.equalTo('isDel',false);
                    cardQuery.equalTo('emp',emp);
                    cardQuery.first().then(function(cardObj){
                        if(card==null||card==undefined||card==''){
                            return res.jsonp({"data":[],"fieldErrors":[{"name":"old","status":"卡号填写不正确"}]});
                        }
                        if(cardObj.get('oldCard')==card||cardObj.get('card').indexOf(tempCard.length>6?tempCard.slice(2):tempCard)>-1){
                            emp.set('card',tempCard);
                            emp.set('old',PrefixInteger(num,10));
                            emp.set('DT_RowId',emp.id);
                            cus.fetch().then(function(){
                                emp.set('cus',cus.get('name'));
                                emp.set('cusId',cus.id);
                                data.push(emp);
                                async.parallel([
                                    function (callback){
                                        promise3(callback);
                                    }
                                    ,function (callback){
                                        promise4(callback);
                                    }],function(err,results){
                                        return res.jsonp({"data":data,"options":[{"cusId":results[1]}]});
                                });
                            });
                        }else{
                            let cardQuery=new AV.Query('EmployeeCard');
                            cardQuery.equalTo('isDel',false);
                            cardQuery.contains('card',tempCard.length>6?tempCard.slice(2):tempCard);
                            cardQuery.count().then(function(count){
                                if(count==0){
                                    cardObj.set('cusId',cus);
                                    cardObj.set('card',tempCard);
                                    cardObj.set('emp',emp);
                                    cardObj.set('oldCard',PrefixInteger(num,10));
                                    cardObj.save();
                                    emp.set('card',tempCard);
                                    emp.set('old',PrefixInteger(num,10));
                                    emp.set('DT_RowId',emp.id);
                                    cus.fetch().then(function(){
                                        emp.set('cus',cus.get('name'));
                                        emp.set('cusId',cus.id);
                                        data.push(emp);
                                        async.parallel([
                                            function (callback){
                                                promise3(callback);
                                            }
                                            ,function (callback){
                                                promise4(callback);
                                            }],function(err,results){
                                                res.jsonp({"data":data,"options":[{"cusId":results[1]}]});
                                        });
                                    });
                                }else if(count>0){
                                    return res.jsonp({"data":[],"fieldErrors":[{"name":"old","status":"卡号已存在"}]});
                                }
                            });
                        }
                    });
                    function promise3(callback1){
                        let powerQuery=new AV.Query('EmployeePower');
                        powerQuery.equalTo('isDel',false);
                        powerQuery.equalTo('emp',emp);
                        powerQuery.find().then(function(powers){
                            async.map(powers,function(power,callback2){
                                if(power.get('cusId').id!=cus.id){
                                    power.set('cusId',cus);
                                    power.save();
                                }
                                callback2(null,power);
                            },function(err,powerres){
                                callback1(null,1);
                            });
                        });
                    }
                    function promise4(callback1){
                        let query=new AV.Query('Customer');
                        query.equalTo('isDel',false);
                        query.find().then(function(results){
                            async.map(results,function(result,callback){
                                result.set('label',result.get('name'));
                                result.set('value',result.id);
                                callback(null,result);
                            },function(err,data){
                                callback1(null,data);
                            });
                        });
                    }
                });
            }
        });
    });
});
//删除员工
router.delete('/employee/remove/:id',function(req,res){
    var id=req.params.id;
    var employee = AV.Object.createWithoutData('Employee', id);
    employee.set('isDel',true);
    employee.save().then(function(emp){
        function promise1(callback){
            let cardQuery=new AV.Query('EmployeeCard');
            cardQuery.equalTo('isDel',false);
            cardQuery.equalTo('emp',emp);
            cardQuery.find().then(function(cards){
                async.map(cards,function(card,callback1){
                    card.set('isDel',true);
                    callback1(null,card);
                },function(err,results){
                    AV.Object.saveAll(cards);
                    callback(null,1);
                });
            });
        }
        function promise2(callback){
            let powerQuery=new AV.Query('EmployeePower');
            powerQuery.equalTo('isDel',false);
            powerQuery.equalTo('emp',emp);
            powerQuery.find().then(function(powers){
                async.map(powers,function(power,callback1){
                    power.set('isDel',true);
                    callback1(null,power);
                },function(err,results){
                    AV.Object.saveAll(powers);
                    callback(null,1);
                });
            });
        }
        async.parallel([
            function (callback){
                promise1(callback);
            },
            function (callback){
                promise2(callback);
            }],function(err,results){
                res.jsonp({"data":[]});
        });
    });
});

//员工权限
router.get('/empPower/:id',function(req,res){
    let empArr=[];
    let resdata={};
    function promise1(callback){
        let id=req.params.id;
        let emp=AV.Object.createWithoutData('Employee',id);
        let query=new AV.Query('EmployeePower');
        query.include('product');
        query.equalTo('emp',emp);
        query.equalTo('isDel',false);
        query.find().then(function(results){
            emp.fetch().then(function(){
                empArr.push({"label":emp.get('empNo')+" "+emp.get('name'),"value":emp.id});
                async.map(results,function(result,callback1){
                    result.set('DT_RowId',result.id);
                    result.set('sku',result.get('product').get('sku'));
                    result.set('productId',result.get('product').id);
                    result.set('product',result.get('product').get('name'));
                    let unitName="";
                    if(result.get('unit')=="month"){
                        unitName="月";
                    }else if(result.get('unit')=="day"){
                        unitName="日";
                    }else if(result.get('unit')=="week"){
                        unitName="周";
                    }
                    result.set('unitName',unitName);
                    callback1(null,result);
                },function(err,data){
                    callback(null,data);
                });
            });
        });
    }
    function promise2(callback1){
        let query=new AV.Query('Product');
        query.equalTo('isDel',false);
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('label',result.get('sku')+" "+result.get('name'));
                result.set('value',result.id);
                callback(null,result);
            },function(err,data){
                callback1(null,data);
            });
        });
    }
    async.parallel([
        function (callback){
            promise1(callback);
        },
        function (callback){
            promise2(callback);
        }],function(err,results){
            let unitArr=[];
            unitArr.push({"label":"日","value":"day"});
            unitArr.push({"label":"月","value":"month"});
            unitArr.push({"label":"周","value":"week"});
            resdata["data"]=results[0];
            resdata["options"]=Object.assign({"productId":results[1]},{"emp":empArr},
            {"unit":unitArr});
            res.jsonp(resdata);
    });
});
//新增权限
var EmpPower = AV.Object.extend('EmployeePower');
router.post('/empPower/add',function(req,res){
    let arr=req.body;
    let power=new EmpPower();
    power.set('unit',arr['data[0][unit]']);
    power.set('count',arr['data[0][count]']*1);
    power.set('period',arr['data[0][period]']*1);
    let emp=AV.Object.createWithoutData('Employee', arr['data[0][emp]']);
    let product=AV.Object.createWithoutData('Product', arr['data[0][productId]']);
    emp.fetch().then(function(){
        power.set('emp',emp);
        power.set('cusId',emp.get('cusId'));
        power.set('product',product);
        power.set('isDel',false);
        power.save().then(function(emppower){
            let data=[];
            emppower.set('DT_RowId',emppower.id);
            let unitName="";
            if(emppower.get('unit')=="month"){
                unitName="月";
            }else if(emppower.get('unit')=="day"){
                unitName="日";
            }else if(emppower.get('unit')=="week"){
                unitName="周";
            }
            emppower.set('unitName',unitName);
            product.fetch().then(function(p){
                emppower.set('productId',p.id);
                emppower.set('sku',p.get('sku'));
                emppower.set('product',p.get('name'));
                emppower.set('used',0);
                data.push(emppower);
                res.jsonp({"data":data});
            });
        },function(error){
            console.log(error);
        });
    });
});
//更新员工权限'+id+'
router.put('/empPower/edit/:id',function(req,res){
    let arr=req.body;
    let id=req.params.id;
    let power = AV.Object.createWithoutData('EmployeePower', id);
    power.set('unit',arr['data['+id+'][unit]']);
    power.set('count',arr['data['+id+'][count]']*1);
    power.set('period',arr['data['+id+'][period]']*1);
    let product=AV.Object.createWithoutData('Product', arr['data['+id+'][productId]']);
    power.set('product',product);
    power.set('isDel',false);
    power.save().then(function(emppower){
        let data=[];
        emppower.set('DT_RowId',emppower.id);
        let unitName="";
        if(emppower.get('unit')=="month"){
            unitName="月";
        }else if(emppower.get('unit')=="day"){
            unitName="日";
        }else if(emppower.get('unit')=="week"){
            unitName="周";
        }
        emppower.set('unitName',unitName);
        product.fetch().then(function(p){
            emppower.set('productId',p.id);
            emppower.set('sku',p.get('sku'));
            emppower.set('product',p.get('name'));
            emppower.set('used',0);
            data.push(emppower);
            res.jsonp({"data":data});
        });
    },function(error){
        console.log(error);
    });
});
//删除权限
router.delete('/empPower/remove/:id',function(req,res){
    let id=req.params.id;
    let employee = AV.Object.createWithoutData('EmployeePower', id);
    employee.set('isDel',true);
    employee.save().then(function(){
        res.jsonp({"data":[]});
    });
});
//售货机管理
router.get('/box',function(req,res){
    let resdata={};
    function promise1(callback1){
        let query=new AV.Query('BoxInfo');
        query.equalTo('isDel',false);
        query.include('cusId');
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('cus',result.get('cusId').get('name'));
                result.set('cusId',result.get('cusId').id);
                result.set('DT_RowId',result.id);
                callback(null,result);
            },function(err,data){
                resdata["data"]=data;
                callback1(null,data);
            });
        });
    }
    function promise2(callback1){
        let query=new AV.Query('Customer');
        query.equalTo('isDel',false);
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('label',result.get('name'));
                result.set('value',result.id);
                callback(null,result);
            },function(err,data){
                callback1(null,data);
            });
        });
    }

    async.parallel([
        function (callback){
            promise1(callback);
        },
        function (callback){
            promise2(callback);
        }],function(err,results){
            resdata["options"]={"cusId":results[1]};
            res.jsonp(resdata);
    });
});
//增加售货机
var Box = AV.Object.extend('BoxInfo');
router.post('/box/add',function(req,res){
    let arr=req.body;
    let box=new Box();
    box.set('address',arr['data[0][address]']);
    box.set('machine',arr['data[0][machine]']);
    box.set('deviceId',arr['data[0][deviceId]']);
    let cus=AV.Object.createWithoutData('Customer', arr['data[0][cusId]']);
    box.set('cusId',cus);
    let version=AV.Object.createWithoutData('Update','585cd8dc61ff4b00688dc4e4');
    box.set('version',version);
    box.set('model',arr['data[0][model]']);
    box.set('type',arr['data[0][issend]']*1?"螺纹柜":"格子柜");
    box.set('issend',arr['data[0][issend]']*1);
    box.set('child',arr['data[0][child]']*1);
    box.set('connecter',arr['data[0][connecter]']);
    box.set('conPhone',arr['data[0][conPhone]']);
    box.set('state',arr['data[0][state]']?arr['data[0][state]']:"可用");
    box.set('isLive',false);
    box.set('isDel',false);
    box.save().then(function(b){
        let data=[];
        b.set('DT_RowId',b.id);
        cus.fetch().then(function(c){
            b.set('cus',c.get('name'));
            data.push(b);
            res.jsonp({"data":data});
        },function(err){
            console.log(err);
        });
    },function(err){
        console.log(err);
    });
});
//更新售货机
router.put('/box/edit/:id',function(req,res){
    let arr=req.body;
    let id=req.params.id;
    let box = AV.Object.createWithoutData('BoxInfo', id);
    box.set('address',arr['data['+id+'][address]']);
    box.set('machine',arr['data['+id+'][machine]']);
    box.set('deviceId',arr['data['+id+'][deviceId]']);
    let cus=AV.Object.createWithoutData('Customer', arr['data['+id+'][cusId]']);
    box.set('cusId',cus);
    let version=AV.Object.createWithoutData('Update','585cd8dc61ff4b00688dc4e4');
    box.set('version',version);
    box.set('model',arr['data['+id+'][model]']);
    box.set('type',arr['data['+id+'][issend]']*1?"螺纹柜":"格子柜");
    box.set('issend',arr['data['+id+'][issend]']*1);
    box.set('child',arr['data['+id+'][child]']*1);
    box.set('connecter',arr['data['+id+'][connecter]']);
    box.set('conPhone',arr['data['+id+'][conPhone]']);
    box.set('state',arr['data['+id+'][state]']?arr['data['+id+'][state]']:"可用");
    box.set('isLive',false);
    box.set('isDel',false);
    box.save().then(function(b){
        let data=[];
        b.set('DT_RowId',b.id);
        cus.fetch().then(function(c){
            b.set('cus',c.get('name'));
            data.push(b);
            res.jsonp({"data":data});
        },function(err){
            console.log(err);
        });
    },function(err){
        console.log(err);
    });
});
//删除售货机
router.delete('/box/remove/:id',function(req,res){
    let id=req.params.id;
    let box = AV.Object.createWithoutData('BoxInfo', id);
    box.set('isDel',true);
    box.save().then(function(){
        function promise1(callback){
            let passageQuery=new AV.Query('Passage');
            passageQuery.equalTo('isDel',false);
            passageQuery.equalTo('boxId',box);
            passageQuery.find().then(function(results){
                results.map(function(result){
                    result['isDel']=false;
                });
                AV.Object.saveAll(results);
            }).then(function(){
                callback(null,1);
            });
        }
        function promise2(callback){
            let boxProductQuery=new AV.Query('BoxProduct');
            boxProductQuery.equalTo('isDel',false);
            boxProductQuery.equalTo('boxId',box);
            boxProductQuery.find().then(function(results){
                results.map(function(result){
                    result['isDel']=false;
                });
                AV.Object.saveAll(results);
            }).then(function(){
                callback(null,1);
            });
        }
        async.parallel([
            function (callback){
                promise1(callback);
            },
            function (callback){
                promise2(callback);
            }],function(err,results){
                res.jsonp({"data":[]});
        });
    });
});
//货道配置
router.get('/passage/:id',function(req,res){
    let resdata={};
    let boxData=[];
    let arr=['A','B','C','D','E','F','G','H','I','J','L'];
    function promise1(callback1) {
        let id=req.params.id;
        let box=AV.Object.createWithoutData('BoxInfo', id);
        let query=new AV.Query('Passage')
        query.include('boxId');
        query.include('product');
        query.equalTo('boxId',box);
        query.equalTo('isDel',false);
        query.ascending('seqNo');
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('DT_RowId',result.id);
                result.set('machine',result.get('boxId').get('machine'));
                result.set('boxId',result.get('boxId').id);
                result.set('type',result.get('type')?result.get('type'):"");
                result.set('sku',result.get('product').get('sku')?result.get('product').get('sku'):"");
                result.set('productId',result.get('product').id);
                result.set('product',result.get('product').get('name'));
                result.set('seqNo',result.get('seqNo'));
                result.set('child',result.get('flag')*1>0?arr[result.get('flag')*1-1]:"");
                result.set('childId',result.get('flag')*1);
                callback(null,result);
            },function(err,data){
                resdata["data"]=data;
                callback1(null,data);
            });
        });
    }
    function promise2(callback1){
        let query=new AV.Query('Product');
        query.equalTo('isDel',false);
        query.ascending('sku');
        query.find().then(function(results){
            async.map(results,function(result,callback){
                result.set('label',result.get('sku')+" "+result.get('name'));
                result.set('value',result.id);
                callback(null,result);
            },function(err,data){
                callback1(null,data);
            });
        });
    }
    function promise3(callback1){
        let id=req.params.id;
        let box=AV.Object.createWithoutData('BoxInfo', id);
        box.fetch().then(function(result){
            boxData.push({"label":result.get('machine'),"value":result.id});
            let count=result.get('child');
            async.timesSeries(count,function(i,callback){
                let child={};
                child['label']=arr[i];
                child['value']=i+1;
                callback(null,child);
            },function(err,data){
                data.splice(0,0,{'label':'无','value':0});
                callback1(null,data);
            });
        });
    }
    async.parallel([
        function (callback){
            promise1(callback);
        },
        function (callback){
            promise2(callback);
        },
        function (callback){
            promise3(callback);
        }],function(err,results){
            resdata["options"]=Object.assign({"productId":results[1]},
            {"childId":results[2]},{"boxId":boxData});
            res.jsonp(resdata);
    });
});
//增加货道
var Passage = AV.Object.extend('Passage');
var BoxProduct=AV.Object.extend('BoxProduct');
router.post('/passage/add',function(req,res){
    let flag=['A','B','C','D','E','F','G','H','I','J','L'];
    let arr=req.body;
    let passage=new Passage();
    passage.set('capacity',arr['data[0][capacity]']*1);
    let product=AV.Object.createWithoutData('Product', arr['data[0][productId]']);
    passage.set('product',product);
    passage.set('row',arr['data[0][seqNo]'].substr(0,1)*1);
    passage.set('col',arr['data[0][seqNo]'].substr(1)*1);
    passage.set('state',arr['data[0][state]']*1?true:false);
    passage.set('seqNo',arr['data[0][seqNo]']);
    passage.set('borrowState',false);
    passage.set('stock',0);
    passage.set('isSend',arr['data[0][isSend]']*1?true:false);
    passage.set('flag',arr['data[0][childId]']>0?arr['data[0][childId]']:"");
    passage.set('type',arr['data[0][childId]']>0?"格子柜":"螺纹柜");
    let box=AV.Object.createWithoutData('BoxInfo', arr['data[0][boxId]']);
    passage.set('boxId',box);
    passage.set('isDel',false);
    function promise1(callback){
        let boxProductQuery=new AV.Query('BoxProduct');
        boxProductQuery.equalTo('isDel',false);
        boxProductQuery.equalTo('boxId',box);
        boxProductQuery.equalTo('productId',product);
        boxProductQuery.count().then(function(count){
            if(count==0){
                let boxpro=new BoxProduct();
                boxpro.set('isDel',false);
                boxpro.set('boxId',box);
                boxpro.set('productId',product);
                boxpro.set('stockDays',0);
                boxpro.set('warning',0);
                boxpro.set('cue',0);
                boxpro.save().then(function(data){
                    callback(null,data);
                });
            }else{
                callback(null,0);
            }
        });
    }
    function promise2(callback){
        box.fetch().then(function(b){
            let cusProQuery=new AV.Query('CustomerProduct');
            cusProQuery.equalTo('isDel',false);
            cusProQuery.equalTo('product',product);
            cusProQuery.equalTo('cusId',b.get('cusId'));
            cusProQuery.first().then(function(cuspro){
                passage.set('customerProduct',cuspro);
                passage.save().then(function(p){
                    let data=[];
                    p.set('DT_RowId',p.id);
                    p.set('machine',b.get('machine'));
                    p.set('boxId',b.id);
                    p.set('type',p.get('type')?p.get('type'):"");
                    p.set('child',p.get('flag')*1>0?flag[p.get('flag')*1-1]:"");
                    p.set('childId',p.get('flag')*1);
                    product.fetch().then(function(pro){
                        p.set('productId',pro.id);
                        p.set('product',pro.get('name'));
                        p.set('sku',pro.get('sku'));
                        data.push(p);
                        callback(null,data);
                    });
                },function(err){
                    console.log(err);
                });
            });
        });
    }
    async.parallel([
        function(callback){
            promise1(callback);
        },
        function (callback) {
            promise2(callback);
        }
    ],function(err,results){
        res.jsonp({"data":results[1]});
    });
});
//更新货道'+id+'
router.put('/passage/edit/:id',function(req,res){
    let flag=['A','B','C','D','E','F','G','H','I','J','L'];
    let arr=req.body;
    let id=req.params.id;
    let passage = AV.Object.createWithoutData('Passage', id);
    passage.set('capacity',arr['data['+id+'][capacity]']*1);
    let product=AV.Object.createWithoutData('Product', arr['data['+id+'][productId]']);
    passage.set('product',product);
    passage.set('row',arr['data['+id+'][seqNo]'].substr(0,1)*1);
    passage.set('col',arr['data['+id+'][seqNo]'].substr(1)*1);
    passage.set('state',arr['data['+id+'][state]']*1?true:false);
    passage.set('seqNo',arr['data['+id+'][seqNo]']);
    passage.set('isSend',arr['data['+id+'][isSend]']*1?true:false);
    passage.set('flag',arr['data['+id+'][childId]']>0?arr['data['+id+'][childId]']:"");
    passage.set('type',arr['data['+id+'][childId]']>0?"格子柜":"螺纹柜");
    let boxQuery=new AV.Query('BoxInfo');
    boxQuery.get(arr['data['+id+'][boxId]']).then(function(b){
        function promise1(callback){
            let boxProductQuery=new AV.Query('BoxProduct');
            boxProductQuery.equalTo('isDel',false);
            boxProductQuery.equalTo('boxId',b);
            boxProductQuery.equalTo('productId',product);
            boxProductQuery.count().then(function(count){
                if(count==0){
                    let boxpro=new BoxProduct();
                    boxpro.set('isDel',false);
                    boxpro.set('boxId',b);
                    boxpro.set('productId',product);
                    boxpro.set('stockDays',0);
                    boxpro.set('warning',0);
                    boxpro.set('cue',0);
                    boxpro.save().then(function(data){
                        callback(null,data);
                    });
                }else{
                    callback(null,0);
                }
            });
        }
        function promise2(callback){
            let cusProQuery=new AV.Query('CustomerProduct');
            cusProQuery.equalTo('isDel',false);
            cusProQuery.equalTo('product',product);
            cusProQuery.equalTo('cusId',b.get('cusId'));
            cusProQuery.first().then(function(cuspro){
                passage.set('customerProduct',cuspro);
                passage.save().then(function(p){
                    let data=[];
                    p.set('DT_RowId',p.id);
                    p.set('machine',b.get('machine'));
                    p.set('child',p.get('flag')*1>0?flag[p.get('flag')*1-1]:"");
                    p.set('childId',p.get('flag')*1);
                    p.set('type',p.get('type')?p.get('type'):"");
                    product.fetch().then(function(pro){
                        p.set('productId',pro.id);
                        p.set('product',pro.get('name'));
                        p.set('sku',pro.get('sku'));
                        data.push(p);
                        callback(null,data);
                    });
                },function(err){
                    console.log(err);
                });
            });
        }
        async.parallel([
            function(callback){
                promise1(callback);
            },
            function(callback){
                promise2(callback);
            }
        ],function(err,results){
            res.jsonp({"data":results[1]});
        });
    });
});
//删除货道
router.delete('/passage/remove/:id',function(req,res){
    let id=req.params.id;
    let passage = AV.Object.createWithoutData('Passage', id);
    passage.set('isDel',true);
    passage.save().then(function(){
        res.jsonp({"data":[]});
    });
});
//售货机产品
router.get('/boxProduct/:id',function(req,res){
    let id=req.params.id;
    let query=new AV.Query('BoxProduct');
    let box=AV.Object.createWithoutData('BoxInfo', id);
    query.equalTo('isDel',false);
    query.equalTo('boxId',box);
    query.include('boxId');
    query.include('productId');
    query.find().then(function(results){
        async.map(results,function(result,callback1){
            let passageQuery=new AV.Query('Passage');
            passageQuery.equalTo('isDel',false);
            passageQuery.equalTo('boxId',box);
            passageQuery.equalTo('product',result.get('productId'));
            passageQuery.count().then(function(count){
                if(count==0){
                    result.destroy();
                }else {
                    passageQuery.find().then(function(passages){
                        let capacity=0;
                        async.map(passages,function(passage,callback){
                            capacity+=passage.get('capacity');
                            callback(null,1);
                        },function(err,passagesres){
                            result.set('capacity',capacity);
                            result.set('DT_RowId',result.id);
                            result.set('machine',result.get('boxId').get('machine'));
                            result.set('product',result.get('productId').get('name'));
                            result.set('sku',result.get('productId').get('sku'));
                            result.set('productId',result.get('productId').id);
                            callback1(null,result);
                        });
                    });
                }
            });
        },function(err,data){
            res.jsonp({"data":data});
        });
    });
});
//售货机产品补货提示、警戒值、备货天数修改
router.put('/boxProduct/edit/:id',function(req,res){
    let id=req.params.id;
    let arr=req.body;
    let boxProduct=AV.Object.createWithoutData('BoxProduct',id);
    let cue=arr['data['+id+'][cue]'];
    let warning=arr['data['+id+'][warning]'];
    let stockDays=arr['data['+id+'][stockDays]'];
    if(typeof(cue)!="undefined"){
        boxProduct.set('cue',cue*1);
    }
    if(typeof(warning)!="undefined"){
        boxProduct.set('warning',warning*1);
    }
    if(typeof(stockDays)!="undefined"){
        boxProduct.set('stockDays',stockDays*1);
    }
    boxProduct.save().then(function(){
        let query=new AV.Query('BoxProduct');
        query.include('boxId');
        query.include('productId');
        query.equalTo('objectId',id);
        query.first().then(function(data){
            data.set('machine',data.get('boxId').get('machine'));
            data.set('DT_RowId',data.id);
            data.set('product',data.get('productId').get('name'));
            data.set('sku',data.get('productId').get('sku'));
            let result=[];
            result.push(data);
            res.jsonp({"data":result});
        });
    });
});
//货道库存
router.get('/passtock',function(req,res){
    let flag=['A','B','C','D','E','F','G','H','I','J','L'];
    var query=new AV.Query('Passage');
    query.equalTo('isDel',false);
    query.include('boxId');
    query.include('boxId.cusId');
    query.include('product');
    query.limit(1000);
    query.find().then(function(results){
        results.forEach(function(result){
            result.set('cus',result.get('boxId').get('cusId').get('name'));
            result.set('machine',result.get('boxId').get('machine'));
            result.set('type',result.get('type')?result.get('type'):"");
            result.set('sku',result.get('product').get('sku')?result.get('product').get('sku'):"");
            result.set('product',result.get('product').get('name'));
            result.set('seqNo',result.get('seqNo'));
            result.set('child',result.get('flag')*1>0?flag[result.get('flag')*1-1]:"");
        });
        res.jsonp({"data":results});
    });
});

router.get('/pasrecord1',function(req,res){
    let draw=req.query.draw;
    let order_column=req.query.order[0].column;
    let order_dir=req.query.order[0].dir;
    console.log("draw:"+draw);
    console.log("order_column:"+order_column);
    console.log("order_dir:"+order_dir);
});
router.get('/pasrecord/:date',function(req,res){
    let arr=req.params.date.split(' - ');
    let start,end;
    start=new moment(arr[0]).startOf('days').format('YYYY-MM-DD HH:mm:ss');
    if(arr.length==1){
        end=new moment(arr[0]).endOf('days').format('YYYY-MM-DD HH:mm:ss');
    }else{
        end=new moment(arr[1]).endOf('days').format('YYYY-MM-DD HH:mm:ss');
    }
    let jsondata=[];
    let takeoutQuery=new AV.Query('TakeOut');
    takeoutQuery.equalTo('isDel',false);
    takeoutQuery.equalTo('result',true);
    takeoutQuery.greaterThanOrEqualTo('time',new Date(start));
    takeoutQuery.lessThanOrEqualTo('time',new Date(end));
    takeoutQuery.include('product');
    takeoutQuery.include('box');
    takeoutQuery.include('emp');
    takeoutQuery.include('emp.cusId');
    takeoutQuery.descending('time');
    takeoutQuery.count().then(function(count){
        let num=Math.ceil(count/1000);
        async.times(num,function(n,callback){
            takeoutQuery.descending('time');
            takeoutQuery.limit(1000);
            takeoutQuery.skip(1000*n);
            takeoutQuery.find().then(function(takeouts){
                async.map(takeouts,function(takeout,callback1){
                    let machine=takeout.get('box').get('machine');
                    let card="";
                    let emp="";
                    let empNo="";
                    emp=takeout.get('emp').get('name');
                    empNo=takeout.get('emp').get('empNo');
                    card=takeout.get('cardNo')?takeout.get('cardNo'):"";
                    let sku=takeout.get('product').get('sku')?takeout.get('product').get('sku'):"";
                    let product=takeout.get('product').get('name');
                    let unit=takeout.get('product').get('unit');
                    let passage=takeout.get('passageNo')?takeout.get('passageNo'):"";
                    let time=new moment(takeout.get('time')).format('YYYY-MM-DD HH:mm:ss');
                    let cus=takeout.get('emp').get('cusId').get('name');
                    let count=takeout.get('count');
                    let price=takeout.get('product').get('price')*count;
                    let unitprice=takeout.get('product').get('price');
                    let onetake={"time":time,"type":"领料","objectId":takeout.get('id'),
                    "cus":cus,"machine":machine,"passage":passage,"count":count,
                    "product":product,"sku":sku,"unit":unit,"employee":emp,
                    "empNo":empNo,"empCard":card,"price":price.toFixed(2),"unitprice":unitprice};
                    jsondata.push(onetake);
                    callback1(null,onetake);
                },function(err,takesres){
                    callback(null,1);
                });
            });
        },function(err,takeoutsres){
            exportExcel(start+" - "+end,jsondata);
            res.jsonp({"data":jsondata});
        });
    });
});
//交易记录
router.get('/pasrecord',function(req,res){
    let arr=['A','B','C','D','E','F','G','H','I','J','L'];
    let takeoutQuery=new AV.Query('TakeOut');
    let borrowQuery=new AV.Query('Borrow');
    let jsondata=[];
    function promise1(callback){
        takeoutQuery.equalTo('isDel',false);
        takeoutQuery.equalTo('result',true);
        takeoutQuery.include('product');
        //takeoutQuery.include('passage');
        takeoutQuery.include('box');
        //takeoutQuery.include('card');
        takeoutQuery.include('box.cusId');
        takeoutQuery.include('emp');
        //takeoutQuery.include('card.emp');
        takeoutQuery.descending('createdAt');
        takeoutQuery.count().then(function(count){
            let num=Math.ceil(count/1000);
            async.times(num,function(n,callback2){
                takeoutQuery.descending('createdAt');
                takeoutQuery.limit(1000);
                takeoutQuery.skip(1000*n);
                takeoutQuery.find().then(function(takeouts){
                    async.map(takeouts,function(takeout,callback1){
                        let machine=takeout.get('box').get('machine');
                        let card="";
                        let emp="";
                        let empNo="";
                        emp=takeout.get('emp').get('name');
                        empNo=takeout.get('emp').get('empNo');
                        card=takeout.get('cardNo')?takeout.get('cardNo'):"";
                        let sku=takeout.get('product').get('sku')?takeout.get('product').get('sku'):"";
                        let product=takeout.get('product').get('name');
                        let unit=takeout.get('product').get('unit');
                        let passage=takeout.get('passageNo')?takeout.get('passageNo'):"";
                        let time=new moment(takeout.get('time')).format('YYYY-MM-DD HH:mm:ss');
                        let cus=takeout.get('box').get('cusId').get('name');
                        let count=takeout.get('count');
                        let price=takeout.get('product').get('price')*count;
                        let onetake={"time":time,"type":"领料","objectId":takeout.get('id'),
                        "cus":cus,"machine":machine,"passage":passage,"count":"-"+count,
                        "product":product,"sku":sku,"unit":unit,"employee":emp,
                        "empNo":empNo,"empCard":card,"price":price.toFixed(2)};
                        jsondata.push(onetake);
                        callback1(null,onetake);
                    },function(error,results){
                        callback2(null,results);
                    });
                });
            },function(err,tempres){
                return callback(null,1);
            });
        });
    }
    function promise2(callback){
        borrowQuery.equalTo('isDel',false);
        borrowQuery.equalTo('result',true);
        borrowQuery.include('product');
        borrowQuery.include('passage');
        borrowQuery.include('box');
        borrowQuery.include('card');
        borrowQuery.include('box.cusId');
        borrowQuery.include('card.emp');
        borrowQuery.descending('createdAt');
        borrowQuery.find().then(function(borrows){
            async.map(borrows,function(borrow,callback1){
                let machine=borrow.get('box').get('machine');
                let card=borrow.get('cardNo')?borrow.get('cardNo'):"";
                let sku=borrow.get('product').get('sku')?borrow.get('product').get('sku'):"";
                let product=borrow.get('product').get('name');
                let unit=borrow.get('product').get('unit');
                let passage=borrow.get('passageNo')?borrow.get('passageNo'):"";
                let time=new moment(borrow.get('time')).format('YYYY-MM-DD HH:mm:ss');
                let cus=borrow.get('box').get('cusId').get('name');
                let emp=borrow.get('card').get('emp').get('name');
                let empNo=borrow.get('card').get('emp').get('empNo');
                let flag=borrow.get('borrow');
                let oneborrow={"time":time,"type":flag?"借":"还",
                "objectId":borrow.get('id'),"cus":cus,"machine":machine,
                "passage":passage,"sku":sku,"product":product,"count":flag?-1:+1,
                "unit":unit,"employee":emp,"empNo":empNo,"empCard":card,"price":0};
                jsondata.push(oneborrow);
                callback1(null,oneborrow);
            },function(error,results){
                return callback(null,results);
            });
        });
    }
    async.parallel([
        function (callback){
            promise1(callback);
        },
        function(callback){
            promise2(callback);
        }],function(err,results){
            res.jsonp({"data":jsondata});
    });
});

//补货业务
router.get('/supply',function(req,res){
    let arr=['A','B','C','D','E','F','G','H','I','J','L'];
    var query=new AV.Query('Supply');
    query.equalTo('isDel',false);
    query.greaterThan('count',0);
    query.include('box');
    query.include('card');
    query.include('passage');
    query.include('passage.product');
    query.include('box.cusId');
    query.find().then(function(results){
        results.forEach(function(result){
            result.set('number',new moment(result.get('createdAt')).unix());
            result.set('product',result.get('passage').get('product').get('name'));
            result.set('time',new moment(result.get('time')).format('YYYY-MM-DD HH:mm:ss'));
            result.set('sku',result.get('passage').get('product').get('sku')?result.get('passage').get('product').get('sku'):"");
            result.set('cus',result.get('box').get('cusId').get('name'));
            result.set('machine',result.get('box').get('machine'));
            //result.set('card',result.get('card').get('card'));
            result.set('passage',result.get('passage').get('flag')*1>0?
            arr[result.get('passage').get('flag')*1-1]+result.get('passage').get('seqNo'):result.get('passage').get('seqNo'));
        });
        res.jsonp({"data":results});
    });
});

//补货计划
router.get('/supplyplan',function(req,res){
    let resdata={};
    let arr=[];
    function getBox(callback){
        let boxQuery=new AV.Query('BoxInfo');
        boxQuery.equalTo('isDel',false);
        boxQuery.include('cusId');
        boxQuery.find().then(function(boxes){
            callback(null,boxes);
        });
    }
    function getBoxProduct(boxes,callback){
        async.map(boxes,function(box,callback1){
            let boxProductQuery=new AV.Query('BoxProduct');
            boxProductQuery.equalTo('isDel',false);
            boxProductQuery.equalTo('boxId',box);
            boxProductQuery.include('productId');
            boxProductQuery.find().then(function(products){
                async.map(products,function(product,callback2){
                    let stock=0;
                    let max=0;
                    let passageQuery=new AV.Query('Passage');
                    passageQuery.equalTo('isDel',false);
                    passageQuery.equalTo('boxId',box);
                    passageQuery.equalTo('product',product.get('productId'));
                    passageQuery.find().then(function(passages){
                        async.map(passages,function(passage,callback3){
                            max+=passage.get('capacity');
                            stock+=passage.get('stock');
                            callback3(null,passage);
                        },function(err,respassage){
                            let light="green";
                            if(stock<=product.get('cue')){
                                light="yellow";
                            }
                            if(stock<=product.get('warning')){
                                light="red";
                            }
                            let one={"light":light,"cus":box.get('cusId').get('name'),"machine":
                            box.get('machine'),"product":
                            product.get('productId').get('name'),"sku":
                            product.get('productId').get('sku'),"max":max,"stock":
                            stock,"cue":product.get('cue'),"warning":
                            product.get("warning"),"count":max-stock,"unit":
                            product.get('productId').get('unit')};
                            arr.push(one)
                            callback2(null,1);
                        });
                    });
                },function(err,resproduct){
                    resdata["data"]=arr;
                    callback1(null,arr);
                });
            });
        },function(err,results){
            callback(null,results);
        });
    }
    async.waterfall([
        function (callback){
            getBox(callback);
        },
        function(boxes,callback){
            getBoxProduct(boxes,callback);
        }
    ],function(err,results){
        return res.jsonp(resdata);
    });
});

//盘点业务
router.get('/checklist',function(req,res){

});

router.get('/checkrecord',function(req,res){

});

//仓库管理
router.get('/storehouse',function(req,res){

});

//数据报表-用量汇总报告
router.get('/summary/:date',function(req,res){
    let resdata={};
    function getCustomer(callback){
        let cusQuery=new AV.Query('Customer');
        cusQuery.equalTo('isDel',false);
        cusQuery.find().then(function(results){
            callback(null,results);
        });
    }
    function getBox(customers,callback){
        let boxQuery=new AV.Query('BoxInfo');
        boxQuery.equalTo('isDel',false);
        boxQuery.find().then(function(results){
            callback(null,customers,results);
        });
    }
    function getCusProduct(customers,boxes,callback){
        let productQuery=new AV.Query('Product');
        productQuery.equalTo('isDel',false);
        productQuery.find().then(function(results){
            callback(null,customers,boxes,results);
        });
    }
    function getTakeout(customers,boxes,products,callback){
        let arr=req.params.date.split(' - ');
        let start,end;
        let query=new AV.Query('TakeOut');
        let boxArr=[];
        let cusArr=[];
        query.equalTo('isDel',false);
        query.equalTo('result',true);
        start=new moment(arr[0]).startOf('days').format('YYYY-MM-DD HH:mm:ss');
        if(arr.length==1){
            end=new moment(arr[0]).endOf('days').format('YYYY-MM-DD HH:mm:ss');
        }else{
            end=new moment(arr[1]).endOf('days').format('YYYY-MM-DD HH:mm:ss');
        }
        query.greaterThanOrEqualTo('time',new Date(start));
        query.lessThanOrEqualTo('time',new Date(end));
        query.include('product');
        query.include('emp');
        query.include('emp.cusId');
        query.count().then(function(count){
            let num=Math.ceil(count/1000);
            let takes=[];
            async.times(num,function(n,callback5){
                query.limit(1000);
                query.descending('createdAt');
                query.skip(1000*n);
                query.find().then(function(results){
                    takes=takes.concat(results);
                    callback5(null,n);
                });
            },function(err,takesres){
                async.map(boxes,function(box,callback1){
                    let boxList=[];
                    let boxData={};
                    boxData['name']=box.get('machine');
                    boxData['count']=0;
                    boxData['total']=0;
                    //boxData['cus']=box.get('cusId').id;
                    async.map(takes,function(take,callback2){
                        if(take.get('box').id==box.id){
                            boxData['count']+=take.get('count');
                            async.map(products,function(product,callback6){
                                if(product.id==take.get('product').id){
                                    let total=product.get('price')*take.get('count');
                                    boxData['total']+=total.toFixed(2)*1;
                                    let price=product.get('price')*take.get('count');
                                    boxList.push({'sku':take.get('product').get('sku'),
                                    'name':take.get('product').get('name'),'id':
                                    take.get('product').id,'price':price,'count':take.get('count'),'unitprice':product.get('price'),'cus':take.get('emp').get('cusId').id});
                                }
                                callback6(null,1);
                            },function(err,cusprosres){
                                callback2(null,take);
                            });
                        }else {
                            callback2(null,1);
                        }
                    },function(err,takeres){
                        if(boxData['count']>0){
                            boxData['list']=boxList;
                            boxArr.push(boxData);
                        }
                        callback1(null,takeres);
                    });
                },function(err,boxres){
                    resdata['box']=boxArr;
                    async.map(customers,function(cus,callback3){
                        let cusList=[];
                        let cusData={};
                        cusData['name']=cus.get('name');
                        cusData['count']=0;
                        cusData['total']=0;
                        async.map(takes,function(take,callback4){
                            if(cus.id==take.get('emp').get('cusId').id){
                                cusData['count']+=take.get('count');
                                cusData['total']+=take.get('product').get('price')*take.get('count');
                                if(cusArr.indexOf(cusData)==-1){
                                    cusArr.push(cusData);
                                }
                                let price=take.get('product').get('price')*take.get('count');
                                cusList.push({'sku':take.get('product').get('sku'),
                                'name':take.get('product').get('name'),'id':
                                take.get('product').id,'price':price,'count':take.get('count'),'unitprice':take.get('product').get('price'),'cus':take.get('emp').get('cusId').id});
                                callback4(null,1);
                            }else{
                                callback4(null,0);
                            }
                        },function(err,bares){
                            cusData['list']=cusList;
                            callback3(null,cus);
                        });
                    },function(err,cusres){
                        resdata['cus']=cusArr;
                        callback(null,boxres);
                    });
                });
            });
        });
    }
    async.waterfall([
        function (callback){
            getCustomer(callback);
        },
        function(customers,callback){
            getBox(customers,callback);
        },
        function(customers,boxes,callback){
            getCusProduct(customers,boxes,callback);
        },
        function(customers,boxes,cuspros,callback){
            getTakeout(customers,boxes,cuspros,callback);
        }
    ],function(err,results){
        return res.jsonp(resdata);
    });
});

//上传excel
var multer  = require('multer');
var upload = multer({ dest: './public/upload' }).single('xlsx_file');
var xlsx = require('node-xlsx');
var fs = require('fs');
router.post('/empUpload', function (req, res) {
    let rescontent="";
    function uploadUser(data,cus,file,res){
        let i=0;
        let cusObj=AV.Object.createWithoutData('Customer',cus);
        async.map(data,function(arr,callback1){
            if(i!=0){
                let empQuery=new AV.Query('Employee');
                empQuery.equalTo('isDel',false);
                empQuery.equalTo('cusId',cusObj);
                empQuery.equalTo('empNo',arr[1].toString());
                empQuery.count().then(function(count){
                    if(count==0){
                        let employee=new Employee();
                        employee.set('empNo',arr[1].toString());
                        employee.set('name',arr[2]);
                        employee.set('sex',1);
                        employee.set('job',arr[5]);
                        employee.set('dept',arr[4]);
                        employee.set('cusId',cusObj);
                        employee.set('isDel',false);
                        employee.save().then(function(emp){
                            let cardQuery=new AV.Query('EmployeeCard');
                            let inputCard=
                            cardQuery.equalTo('isDel',false);
                            cardQuery.equalTo('oldCard',PrefixInteger(arr[3].toString(),10));
                            cardQuery.equalTo('card',PrefixInteger(arr[3].toString(16),6));
                            //console.log(PrefixInteger(arr[3].toString(),10));
                            cardQuery.equalTo('cusId',cusObj);
                            cardQuery.count().then(function(cardcount){
                                if(cardcount==0){
                                    let card=new EmpCard();
                                    card.set('card',PrefixInteger(arr[3].toString(16),6));
                                    card.set('oldCard',PrefixInteger(arr[3].toString(),10));
                                    card.set('emp',emp);
                                    card.set('cusId',cusObj);
                                    card.set('isDel',false);
                                    card.save().then(function(){
                                        callback1(null,arr[1].toString());
                                    });
                                }else {
                                    rescontent+="卡号:"+arr[3]+"已存在;<br>";
                                    callback1(null,0);
                                }
                            });
                        });
                    }else {
                        rescontent+="工号:"+arr[1]+"已存在;<br>";
                        callback1(null,0);
                    }
                });
            }else {
                callback1(null,0);
            }
            i++;
        },function(err,results){
            fs.unlinkSync(file);
            res.send("员工信息导入完成。<br>"+rescontent);
        });
    }
    function uploadPower(data,cus,file,res){
        let tempi=0;
        let i=0;
        let cusObj=AV.Object.createWithoutData('Customer',cus);
        async.map(data,function(arr,callback){
            if(i!=0){
                //console.log('%j',arr[1]);
                let empQuery=new AV.Query('Employee');
                empQuery.equalTo('isDel',false);
                empQuery.equalTo('cusId',cusObj);
                empQuery.equalTo('empNo',arr[1].toString());
                empQuery.first().then(function(emp){
                    if(typeof(emp)=="undefined"){
                        rescontent+="未找到工号"+arr[1].toString()+"的信息;<br>";
                        return callback(null,0);
                    }
                    let productQuery=new AV.Query('Product');
                    productQuery.equalTo('isDel',false);
                    productQuery.equalTo('sku',arr[2].trim());
                    productQuery.first().then(function(product){
                        if(typeof(product)=="undefined"){
                            rescontent+="未找到产品编号"+arr[2]+"的信息;<br>";
                            return callback(null,0);
                        }
                        //console.log(arr[1]+":"+arr[2]);
                        let empPowerQuery=new AV.Query('EmployeePower');
                        empPowerQuery.equalTo('isDel',false);
                        empPowerQuery.equalTo('emp',emp);
                        empPowerQuery.equalTo('product',product);
                        empPowerQuery.count().then(function(count){
                            if(count>0){
                                rescontent+="工号"+arr[1]+"领取产品"+arr[2]+"的权限已存在<br>";
                                tempi++;
                                return callback(null,0);
                            }
                            let power=new EmpPower();
                            power.set('emp',emp);
                            power.set('cusId',cusObj);
                            power.set('product',product);
                            let unit="day";
                            let takecount=arr[5]*1;
                            let period=arr[3]*1;
                            if(arr[4].trim()=="月"){
                                unit="month";
                            }else if(arr[4].trim()=="日"){
                                unit="day";
                                if(period==7){
                                    unit="week";
                                    period=1;
                                }
                            }else if (arr[4].trim()=="周") {
                                unit="week";
                            }
                            power.set('unit',unit);
                            power.set('count',takecount);
                            power.set('period',period);
                            power.set('isDel',false);
                            power.save().then(function(p){
                                return callback(null,p);
                            });
                        });
                    });
                });
            }else {
                callback(null,0);
            }
            i++;
        },function(err,results){
            fs.unlinkSync(file);
            res.send("员工权限导入完成。<br>"+rescontent);
        });
    }
    function uploadDept(data,cus,file,res){
        let i=0;
        let count=0;
        let cusObj=AV.Object.createWithoutData('Customer',cus);
        async.map(data,function(arr,callback){
            if(i!=0){
                let empQuery=new AV.Query('Employee');
                empQuery.equalTo('isDel',false);
                //empQuery.equalTo('cusId',cusObj);
                empQuery.equalTo('empNo',arr[0].toString().trim());
                empQuery.first().then(function(empObj){
                    if(typeof(empObj)!="undefined"){
                        rescontent+=arr[0].toString().trim()+"未找到<br>";
                        callback1(null,0);
                    }else {
                        empObj.set('dept',arr[1].trim());
                        empObj.save().then(function(){
                            count++;
                            return callback(null,1);
                        })
                    }
                });
            }
            i++;
        },function(err,results){
            fs.unlinkSync(file);
            res.send("员工部门导入完成。共计："+count+"<br>"+rescontent);
        });
    }
    upload(req, res, function (err) {
        let flag=req.body.radio;
        let cus=req.body.customer;
        if (err) {
            return res.send("上传失败:"+err);
        }
        if(typeof(req.file)=="undefined"){
            return res.send("请选择上传文件");
        }
        let obj = xlsx.parse(req.file.path);
        let excelObj=obj[0].data;
        let data = [];
        let tempEmpNo=[];
        for(let i in excelObj){
            let arr=[];
            let value=excelObj[i];
            if(tempEmpNo.indexOf(value[1])==-1&&flag==1){
                tempEmpNo.push(value[1]);
                for(let j in value){
                    arr.push(value[j]);
                }
                data.push(arr);
            }else if (flag==2) {
                for(let j in value){
                    arr.push(value[j]);
                }
                //if(arr.length==7)
                    data.push(arr);
            }
        }
        if(flag==1){
            uploadUser(data,cus,req.file.path,res);
        }else if(flag==2){
            uploadPower(data,cus,req.file.path,res);
        }else if(flag==3){
            uploadDept(data,cus,req.file.path,res);
        }
    });
});
function PrefixInteger(num, n) {
    var len = num.toString().length;
    while(len < n) {
        num = "0" + num;
        len++;
    }
    return num;
}

var ejsExcel = require("ejsexcel");
function exportExcel(filename,data){
    let exlBuf = fs.readFileSync("./public/upload/pasrecord.xlsx");
    //用数据源(对象)data渲染Excel模板
    ejsExcel.renderExcelCb(exlBuf, data, function(err,exlBuf2){
    if(err) {
        console.error(err);
        return;
    }
    fs.writeFileSync("./public/upload/交易清单"+filename+".xlsx", exlBuf2);
        console.log(filename);
    });
}
module.exports = router;
