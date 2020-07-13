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
router.get('/upload/:img', async ctx=>{
  let img=ctx.params.img;

  await send(ctx, img, {
    maxage: 60*86400*1000,
    immutable: true,
    root: upload_dir
  });
});

static(router);

module.exports=router.routes();
