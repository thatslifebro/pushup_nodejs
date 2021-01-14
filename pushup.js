var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');

var list = function(_filelist){
  var flist = '<ul>'
  for(var i=0;i<_filelist.length;i++){
    flist +=`<li><a href="/?id=${_filelist[i]}">${_filelist[i]}</a></li>`;
  }
  flist += '</ul>';
  return flist;
}

var html = function(body){
  var template =`
  <!DOCTYPE html>
  <html>
  <head>
    <title>PUSHUP-RECORD</title>
    <meta charset = "utf-8">
  </head>
  <body>
    ${body}
  </body>
  </html>
  `;
  return template;
}

var app = http.createServer(function(request,response){
  var _url = request.url;
  var queryData = url.parse(_url,true).query;
  var pathname = url.parse(_url,true).pathname;
  var title =queryData.id;
  if(pathname==='/'){
    if(title===undefined){
      fs.readdir('./pushuplist',function(err,filelist){
        var flist = list(filelist);
        var template=html(`
        <h1><a href="/">PUSHUP KING</a></h1>
        <h3><a href="/create">new record</a></h3>
        ${flist}
        `);
        response.writeHead(200);
        response.end(template);
      });
    } else {
      fs.readdir('./pushuplist',function(err,filelist){
        fs.readFile(`./pushuplist/${title}`,'utf8',function(err,data){
          var template =html(`
            <h1><a href="/">PUSHUP KING </a>(${title})</h1>
            <a href="/update?id=${title}">update</a>
            <form action='/delete_process' method='post'>
              <input type='hidden' name='date' value=${title}>
              <input type='submit' value='delete'>
            </form>
            <p>${data}</p>
          `);
          response.writeHead(200);
          response.end(template);
        });
      });
    }
  } else if(pathname==='/create'){
    var form = `
    <form action="/create_process" method="post">
      <p><input type="text" placeholder="date" name="date" value=""></p>
      <p>
        <textarea name="record" placeholder="record"></textarea>
      </p>
      <p>
        <input type="submit">
      </p>
    </form>
    `
    var template =html(`
      <h1><a href="/">PUSHUP KING</a></h1>
      <h2>new record</h2>
      ${form}
    `);
    response.writeHead(200);
    response.end(template);
  } else if(pathname==='/create_process'){
    var body='';
    request.on('data',function(data){
      body+=data;
    });
    request.on('end',function(){
      var post = qs.parse(body);
      var date = post.date;
      var record = post.record;
      fs.writeFile(`./pushuplist/${date}`, record, 'utf8', function(err){
        response.writeHead(302,{Location: `/`});
        response.end();
      });
    });
  } else if(pathname === '/update'){
    fs.readFile(`./pushuplist/${title}`,'utf8',function(error, record){
      var template =html(`
          <h1><a href="/">PUSHUP KING </a>(${title})</h1>
          <form action = '/update_process' method='post'>
            <p><input type='hidden' name='id', value='${title}'></p>
            <p><input type='text' name='date' value='${title}'></p>
            <p><textarea name ='record'>${record}</textarea></p>
            <p><input type='submit'></p>
          </form>

      `);
      response.writeHead(200);
      response.end(template);
    })
  } else if(pathname === '/update_process'){
    var body='';
    request.on('data',function(data){
      body+=data;
    });
    request.on('end',function(){
      var post = qs.parse(body);
      var id = post.id;
      var date = post.date;
      var record = post.record;
      fs.rename(`pushuplist/${id}`,`pushuplist/${date}`,function(error){
        fs.writeFile(`pushuplist/${date}`,record,'utf8',function(err){
          response.writeHead(302,{Location:`/?id=${qs.escape(date)}`});
          response.end();
        });
      });
    });
  } else if(pathname === '/delete_process'){
    var body='';
    request.on('data',function(data){
      body+=data;
    })
    request.on('end',function(){
      var post = qs.parse(body);
      var date = post.date;
      fs.unlink(`pushuplist/${date}`,function(err){
        response.writeHead(302,{Location:`/`});
        response.end();
      });
    });
  }
  else {
    response.writeHead(404);
    response.end('Not found');
  }
});
app.listen(3001);
