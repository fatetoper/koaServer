/*
 * @Author: fatetoper
 * @Date: 2019-07-19 08:59:46
 * @LastEditors: fatetoper
 * @LastEditTime: 2020-09-14 20:48:56
 * @Modultype: Component
 * @Usage: import/global/prototype
 * @Description: Do not edit
 * @FilePath: \node\router\index.js
 */
const Router=require('koa-router');
const static=require('./static');
const send=require('koa-send');
const {upload_dir}=require('../config');
const path=require('path');

let router=new Router();
// 根据需要修改
router.use('/admin', require('./admin'));
router.use('', require('./web'));
router.use('/api', require('./api'));
router.use('/db', require('./db'));

// ==============
router.get('/upload/:path/:img', async ctx=>{
  let img=ctx.params.img;
  let path=ctx.params.path;
  await send(ctx, img, {
    maxage: 60*86400*1000,
    immutable: true,
    root: upload_dir + '/' + path
  });
});

static(router);

module.exports=router.routes();
