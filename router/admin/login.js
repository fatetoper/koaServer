const {post}=require('../../libs/body');
const passwordLib=require('../../libs/password');
const {admin}=require('../../libs/regs');

module.exports=function (router){
  router.get('/login', async ctx=>{
    await ctx.render('admin/login', {error: null, username: '', password: ''});
  });
  router.post('/login', async ctx=>{
    let {username,password}=ctx.request.fields;
    username=username.toLowerCase();

    async function render(msg){
      await ctx.render('admin/login', {error: msg, username, password});
    }

    //数据校验
    if(!admin.username.test(username)){
      await render('用户名格式不对，需要4-32个数字、字母');
    }else if(!admin.password.test(password)){
      await render('密码格式不对，需要6-32个字符');
    }else{
      //1.用户存在？
      let rows=await ctx.db.query("SELECT ID,password FROM admin_table WHERE username=?", [username]);

      if(rows.length==0){
        await render('此用户不存在');
      }else{
        //2.密码？
        if(rows[0].password==passwordLib(password)){
          ctx.session['adminID']=rows[0].ID;
          ctx.redirect('/admin/');
        }else{
          await render('用户名或密码不对');
        }
      }
    }
  });
};
