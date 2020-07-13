const Router=require('koa-router');
const {upload}=require('../../libs/body');
const path=require('path');
const regs=require('../../libs/regs');
const fs=require('promise-fs');
const {upload_dir}=require('../../config');

let router=new Router();

const tabs=[
  {title: 'banner管理', url: '/admin/banner', name: 'banner'},
  {title: '车辆管理', url: '/admin/car', name: 'car'},
  {title: '留言管理', url: '/admin/msg', name: 'msg'},
];

router.use(async (ctx,next)=>{
  if(!ctx.session['adminID'] && ctx.url!='/admin/login'){
    ctx.redirect('/admin/login');
  }else{
    await next();
  }
});

router.get('/', async ctx=>{
  await ctx.render('admin/table');
});

require('./login')(router);

addRouter(
  'banner',
  {
    title: {title: '标题', type: 'text', reg: regs.admin.title, err_msg: '标题有误'},
    sub_title: {title: '副标题', type: 'text', reg: regs.admin.title, err_msg: '副标题有误'},
    image: {title: '图片', type: 'file'},
  }
)

addRouter(
  'car',
  {
    title: {title: '名称', type: 'text'},
    price: {title: '价格', type: 'number'},
    features: {title: '信息', type: 'fields', show_in_table: false},
    description: {title: '描述', type: 'textarea'},
    images: {title: '图片', type: 'files', show_in_table: false},
  }
)

function addRouter(name, fields){
  const page_size=10;

  async function preprocess(ctx,next){
    //预处理
    let datas=ctx.request.fields;

    for(let name in fields){
      let field=fields[name];

      switch(field.type){
        case 'file':
          if(datas[name][0].size==0){
            datas[name]='';

            try{
              await fs.unlink(datas[name][0].path);
            }catch(e){
              console.log(e);
            }
          }else{
            datas[name]=path.basename(datas[name][0].path);
          }
          break;
        case 'files':
          for(let i=0;i<datas[name].length;i++){
            if(datas[name][i].size==0){
              try{
                await fs.unlink(datas[name][i].path);
              }catch(e){
                console.log(e);
              }
            }
          }

          datas[name]=datas[name].filter(file=>file.size).map(file=>path.basename(file.path)).join(',');
          break;
        case 'fields':
          let keys=datas[`${name}_key`];
          let values=datas[`${name}_value`];

          delete datas[`${name}_key`];
          delete datas[`${name}_value`];

          //key|value,key|value,...
          let arr=[];
          for(let i=0;i<keys.length;i++){
            arr.push(keys[i]+'|'+values[i]);
          }

          datas[name]=arr.join(',');
          break;
      }
    }

    ctx.datas=datas;
    await next();
  }

  //查看
  //  
  router.get(`/${name}`, async ctx=>{
    ctx.redirect(`/admin/${name}/1`);
  });

  router.get(`/${name}/:page`, async ctx=>{
    let {page}=ctx.params;
    page=parseInt(page);
    if(isNaN(page) || page<1){
      page=1;
    }


    let datas=await ctx.db.query(`SELECT * FROM ${name}_table ORDER BY ID DESC LIMIT ?,?`, [(page-1)*page_size, page_size]);
    let rows=await ctx.db.query(`SELECT count(*) AS c FROM ${name}_table`);
    let count=rows[0].c;


    let page_count=Math.ceil(count/page_size);

    let cur_tab=-1;

    tabs.forEach((tab,index)=>{
      if(tab.name==name)cur_tab=index;
    });

    await ctx.render('admin/table', {name, datas, fields, page, page_count, tabs, cur_tab});
  });

  //添加
  router.post(`/${name}`, ...upload({
    maxFileSize: 5*1024*1024
  }), preprocess, async ctx=>{
    //let datas=await process(ctx.request.fields);
    let datas=ctx.datas;

    //校验
    let errors=[];
    for(let name in fields){
      let {reg,err_msg}=fields[name];
      if(!reg)continue;

      if(!reg.test(ctx.request.fields[name])){
        errors.push(err_msg);
      }
    }

    if(!errors.length){
      let arr_field=[];
      let arr_value=[];
      for(let name in datas){
        arr_field.push(name);         //title, sub_title, image
        arr_value.push(datas[name]); //
      }

      //插入
      await ctx.db.query(`INSERT INTO ${name}_table (${arr_field.join(',')}) VALUES(${arr_value.map(a=>'?').join(',')})`, arr_value);

      ctx.redirect(`/admin/${name}`);
    }else{
      ctx.body=errors.join(', ');
    }
  });


  //修改
  router.post(`/${name}/:id`, ...upload({
    maxFileSize: 5*1024*1024
  }), preprocess, async ctx=>{
    let {id}=ctx.params;
    console.log('modify');
    // console.log(ctx.request.fields);
    let datas=ctx.datas;

    //文件类？
    for(let name in fields){
      if(fields[name].type=='file' || fields[name].type=='files'){
        if(!datas[name]){
          delete datas[name];
        }
      }
    }

    let arr_field=[];
    let arr_value=[];
    for(let name in datas){
      arr_field.push(name);         //title, sub_title, image
      arr_value.push(datas[name]); //
    }

    await ctx.db.query(`UPDATE ${name}_table SET ${arr_field.map(key=>key+'=?').join(',')} WHERE ID=?`, [...arr_value, id]);

    ctx.redirect(`/admin/${name}`);
  });


  //删除
  router.get(`/del${name}/:id`, async ctx=>{
    let {id}=ctx.params;

    let arrId=id.split('|');

    for(let i=0;i<arrId.length;i++){
      let id=arrId[i];
      let rows=await ctx.db.query(`SELECT * FROM ${name}_table WHERE ID=?`, [id]);

      if(rows.length>0){
        let data=rows[0];

        let aPath=[];
        for(let name in fields){
          if(fields[name].type=='file' || fields[name].type=='files'){
            aPath=aPath.concat(data[name].split(','));
          }
        }

        //数据
        await ctx.db.query(`DELETE FROM ${name}_table WHERE ID=?`, [id]);

        //文件——删？不删？
        for(let i=0;i<aPath.length;i++){
          try{
            await fs.unlink(path.resolve(upload_dir, aPath[i]));
          }catch(e){
            console.log(e); //?
          }
        }
      }else{
        ctx.body='找不到数据';
      }

    }
    ctx.redirect(`/admin/${name}`);
  });



}

router.get('/msg', async ctx=>{
  let datas=await ctx.db.query("SELECT * FROM msg_table ORDER BY ID DESC");
  await ctx.render('admin/msg', {datas, tabs, cur_tab: 2});
});



module.exports=router.routes();
