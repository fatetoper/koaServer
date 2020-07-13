//  功能设定： 通过这个API可以往数据库上传数据
//  


const Router=require('koa-router');
const static=require('../../libs/contentStatic');

let router=new Router();



router.get('/',
  // 从Redis找一下缓存放到ctx.body里，没有就render一个再存点Redis里
  // static('page:'),
  async ctx=>{
    
    console.log('ctx.params:',ctx.params);
    //模板位置 'template/web/index'
    await ctx.render('db/index');
  }
);

router.get('/single/:id', 
  async ctx=>{
    let {id}=ctx.params;

    await ctx.render('web/single', {id});
});

// router.get('/', async ctx=>{
//   console.log('ctx.params:',ctx.params);
//   // let {id}=ctx.params;
//   // await ctx.render('db/index', {id});

//   await ctx.render('db/index');
// });



module.exports=router.routes();
