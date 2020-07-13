const Router=require('koa-router');
const static=require('../../libs/contentStatic');
const {upload,body}=require('../../libs/body');

let router=new Router();

// {
//   ok: true, data: [],{}
// }
// {
//   ok: false, msg: '参数有误/数据不存在'
// }

router.use(async (ctx,next)=>{
  try{
    await next();

    if(ctx.body!==undefined){
      ctx.status=200;
      ctx.body={ok: true, data: ctx.body};
    }else{
      ctx.status=404;
      ctx.body={ok: false, msg: 'data not found:/api/db.js'};
    }
  }catch(e){
    console.log(e);
    // ctx.body={ok: false, msg: e.message};
    ctx.status=500;
    ctx.body={ok: false, msg: 'server error'};
  }
});


// 写入数据	/api/db/insert
 // router.post(get)(path, fn ,fn1, fn2 ,fn3 ) 里面可以加多个处理函数，执行顺序依次执行 
 router.post('/insert', ...upload(), async ctx=>{
  // 接收josn数据是在 ctx.request.fields 里
  let datas=ctx.request.fields;
  let co =0;
  const table = datas.table;
  let fields = datas.fields; // 进来是个二维数组，需要转化
  if(typeof datas.fields[1]=='object'){
    fields = [...datas.fields[0],...Object.keys(datas.fields[1])];
  }
  // console.log("fields:",fields);
  
  const data = datas.data;
  let res=[];
  let warnigList = [];
  // console.log("data.length:",data.length);
  for(let i =0;i<data.length;i++){
    const key = Object.keys(data[i]);
    const values = Object.values(data[i]);
 
    // SQL语句使用变量拼接
    let spanKey = key.reduce((span,cur)=>{
      return span + ',' + cur;
    });
    let spanValues = values.reduce((span,cur)=>{
      if(typeof cur == 'string'){
        cur = '"' + cur + '"';
      }else if(typeof cur == 'number'){}
      return span + ',' + cur;
    });
    // console.log("spanKey:",spanKey);
    // console.log("spanValues:",spanValues);
    // throw new Error();
    let sql = "INSERT INTO " + table + ` (${spanKey}) VALUES(${spanValues})`;
    // console.log("sql:",sql);
    let result = await ctx.db.query(sql);
    res.push(result);
    // console.log("result:",result);
    
    if(co<3){
      if(result.warningCount>0){
      let showWarnings = await ctx.db.query("show warnings;")
        console.log("showWarnings:",showWarnings);
        warnigList.push(showWarnings);
      }
      co++;
    }
  }
    
  // console.log("res:",res);
  if(warnigList.length>0){
    ctx.body=warnigList;
  }else{
    ctx.body='okk';
  }
});


 // 测试数据结构	/api/db/test
 // router.post(get)(path, fn ,fn1, fn2 ,fn3 ) 里面可以加多个处理函数，执行顺序依次执行 
 router.post('/test', ...upload(), async ctx=>{
  // 接收josn数据是在 ctx.request.fields 里
  let datas=ctx.request.fields;
  // console.log("datas:",datas)
  const table = datas.table;
  let fields = datas.fields;
  if(typeof datas.fields[1]=='object'){
    console.log("translate fields================begin")
    fields = [...datas.fields[0],...Object.keys(datas.fields[1])];
  }
  
  // console.log("table:",table)
  console.log("fields:",fields)
  let body = [];
  let dbname = datas.dbname || "z_blue_cars";
  let has =async function(table,fields,dbname){
    let body = [];
    // 判断table是否存在
    let sql = "select TABLE_NAME from INFORMATION_SCHEMA.TABLES where TABLE_SCHEMA='" + dbname + "' and TABLE_NAME='" + table + "';";
    let hasTable = await ctx.db.query(sql);  
    //  数据库、表名称不对返回 空数组 ，存在该表则返回 [RowDataPacket{TABLE_NAME:'tablename'}]
    //  返回值读取方法：  hasTable[0].TABLE_NAME
    // console.log("hasTable:",hasTable[0].TABLE_NAME);
    if(hasTable.length!==0){
      // 仅判断字段是否存在
      if(fields.length>0){
        for(let i=0;i<fields.length;i++){
          let sql = "select count(*) from information_schema.columns where table_name = '" + table + "' and column_name = '" + fields[i] + "';";
          let hasField = await ctx.db.query(sql);
          // console.log("hasField:",hasField[0]['count(*)']);
          if(hasField[0]['count(*)']==0){
            body.push(`there is no ${fields[i]} in table: ${table}`);
          }
        }
     /*    // map使用异步的方法  暂时是个坑,在不考虑执行顺序的前提下可使用
       fields.map(async field=>{
          // 异步的调用 通过 async 立即执行函数包装起来
          (async ()=>{
            // SQL语句使用变量拼接
            let sql = "select count(*) from information_schema.columns where table_name = '" + table + "' and column_name = '" + field + "';";
            let hasField = await ctx.db.query(sql);
            console.log("hasField:",hasField[0]['count(*)']);
            body.push(`there is no $(field) in $(table)`);
            if(hasField[0]['count(*)']==0){
              body.push(`there is no $(field) in $(table)`);
            }
          })()
        }) */
      }else{
        body.push('fields` form is incorrect');
      }
    }else{
      body.push('there is no that table');
    }

    return body;
  }
  body =await has(table,fields,dbname);
  console.log("body:",body)
  console.log("=============================TestEnd==============================\n==================================================================")

  if(body.length==0){
    ctx.body='ok';
  }else{
    ctx.body=body;
  }
  
});

 
module.exports=router.routes();
