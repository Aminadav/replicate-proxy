var express=require('express');
var fs=require('fs');
var request=require('request');
var stdio=require('stdio');
var keypress=require('keypress');
keypress(process.stdin)
var moment=require('moment')
var colors=require('colors')

options=stdio.getopt({
	repeat:{key:'r',args:2,description:'when repeating requesting you should specificy log file, and or timestamp'},
	'config':{key:'c',args:1,description:'Default is settings.json'},
	'watch':{key:'w',description:'Watching and reloading everytimg the config file changed'},
	'view':{key:'v',args:1,description:'View log file to repeat...'},
})

/* We are doing two things, outside the main software:
 * 1. Split the webhook to many server if it is needed.
 * 2. We save the request, and let us to repeat it.
 * 3. We save all the request, and when we need to repeat we can specifiy the server
 * 4. If there is master, we reply with master response! 
 */

if (options.view){
	var file=fs.readFileSync(options.view,'utf-8')
	// listen for the "keypress" event 
	var i=0
	file=file.split('\r').reverse()
	var k=[]
	var n;
	showNext()
	process.stdin.on('keypress', function (ch, key) {
		if(ch.match(/[1-9]/)){
			n=parseInt(ch);
			console.log(n)
			console.log(k[n])			
			console.log('---')
			console.log('R: Repeat. B: back to list')			
		}
		else if(key && key.name=='b'){
			i-=10;
			showNext()
		}
		else if(key && key.name=='r'){
			console.log('tryRepat')
			repeat(k[n])
			console.log('after')
		}
	  else if (key&&key.name=='c') {
	  	process.exit()
	  }
	  else{
	  	showNext()
	  }
	});	 
	process.stdin.setRawMode(true);
	process.stdin.resume();
	function showNext(){
		k=[]
		for(var j=0;j<file.length && j<=9;j++,i++){
			try{
				x=JSON.parse(file[i])
				k[j]=x
				var d=new Date(x.timestamp);
				d=moment(d).format('DD/MM HH:MM')
				console.log(' ' + colors.red.bold(j) + '  -  ' + colors.gray('(' + (file.length-i) + ') ' + d),x.method + ' ' + colors.bold(x.url))
			}
			catch(asdd){

			}
		}
			console.log('---')
			console.log('Space - Continue. 1-9: More details.')
	}
}
else if(options.repeat){
	try{
		var file=fs.readFileSync(options.repeat[0],'utf-8')
	}
	catch(erer){
		console.log('File  not found:',options.repeat[0])
		process.exit();
	}
	file=file.split('\r\n')
	var row
	var id=parseInt(options.repeat[1])	
	if(!id){
		console.log('You must specify row number in log file, or timestamp  id')
		process.exit();
	}
	if (id<10000000) {
		//get by line
		row=JSON.parse(file[id-1])
	}
	else{
		//get by timestamp
		for(var i=0;i<file.length;i++){
			if (file[i].length>0 && JSON.parse(file[i]).timestamp==id){
				row=JSON.parse(file[i]);
				break;
			}				
		}
	}
	repeat(row);
	function repeat(row){
		if(row){
			console.log(colors.red.bold('Repeating:...'))
			console.log(require('util').inspect(row))
			var headers=row.headers
			headers.isRepeat=true
			request({
				url:row.url,
				headers:headers,
				body:row.body,
				method:row.method
			},function(err,obj,body){
				if(err) console.log('error',err)
				console.log(obj && obj.statusCode)
				console.log(body)
			})
		}
	}		
}
else{
	settingsFile=options.config || 'settings.json';
	if(options.watch){
		fs.watch(process.cwd() + '/' + settingsFile,function(){
			console.log('reloading, after config changed');
			server.close();
			webhooksplit();
		})
	}

	webhooksplit()
}

var server;
function webhooksplit(){
	console.log('Settings File: ' + settingsFile)
	try{
		var settings=JSON.parse(fs.readFileSync(process.cwd() + '/' + settingsFile,'utf-8'));
	}
	catch(er){
		console.log('settings file not exists, or it is not JSON. You can change the settings file by using --config')
		console.log(er.message)
		process.exit();
	}

	for (var i=0;i<settings.length;i++){
		createServer(settings[i]);
	}

	function createServer(settings){
		var app=express();
		var http=require('http');
		app.use(function(req,res){
			var data='';
			if(req.headers['content-length'] && parseInt(req.headers['content-length'])>0){
				req.on('data',function(chunk){
					data+=chunk
				})
				req.on('end',function(){
					dataReady();
				})
			}
			else{
				dataReady()
			}
			function dataReady(){
				var log={}
				log.timestamp=new Date().valueOf()
				log.url=req.protocol + '://' + req.headers['host']  + req.url;
				log.headers=req.headers;
				log.ip=req.ip
				log.body=data
				log.method=req.method
				if(settings.log){
					require('fs').appendFileSync(process.cwd() + '/' + settings.log,JSON.stringify(log) + '\r\n')
				}

				var thereIsMaster=false
				console.log('h')
				for (var i=0;i<settings.webhooks.length;i++){			
					if(settings.webhooks[i].master && !thereIsMaster) thereIsMaster=true
					forward(req.url,req.method,JSON.parse(JSON.stringify(req.headers)),settings.webhooks[i],data,function(err,obj,body){
						if(err){
							res.end('Error Proxying:' + err.message)
							return
						}
						res.writeHead(obj.statusCode,obj.headers)
						res.end(body);
					})
				}
				console.log('i')
				if(!thereIsMaster)
				res.end('forwarding')
			}
		})
		server=http.createServer(app).listen(settings.port || 80,settings.ip)
	}

	function forward(reqUrl,reqMethod,reqHeaders,webhook,data,callback){
		var u=require('url').parse(reqUrl)
		var forwardTo=webhook.url    + (u.pathname!=='/' ? u.pathname :'') + (u.search || '');
		var headers=reqHeaders;
		delete headers.host
		console.log('Forwarding to:', forwardTo);
		var requestJson={
			timestamp:new Date().valueOf(),
			url:forwardTo,
			method:reqMethod,
			headers:headers,
			body:data
		}
		request(requestJson,function(err,obj,body) {
			if(webhook.log){
				requestJson.responseerr=err
				requestJson.response=body
				requestJson.statusCode=obj && obj.statusCode
				require('fs').appendFileSync(process.cwd() + '/' + webhook.log,JSON.stringify(requestJson) + '\r\n')
			}
			if(callback && webhook.master){
				callback.apply(null,arguments)
			}
		}
		)

	}
}