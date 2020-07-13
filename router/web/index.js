const Router=require('koa-router');
const static=require('../../libs/contentStatic');

let router=new Router();

router.get('/',
 // 从Redis找一下缓存放到ctx.body里，没有就render一个再存点Redis里
  static('page:'),
  async ctx=>{
    //模板位置 'template/web/index'
    await ctx.render('web/index');
  }
);

router.get('/single/:id', async ctx=>{
  let {id}=ctx.params;

  await ctx.render('web/single', {id});
});

router.get('/contact', async ctx=>{
  await ctx.render('web/contact');
});



module.exports=router.routes();
