
var expect=require('chai').expect;
var fs=require('fs');
var mockRequest=require('supertest');

describe('describe',function(){

	var app=require('../app.js')(
		{
			"ip":"127.0.0.23",
			"port":"80",
			"servers":[
				"123.457.432.123",
				"222.322.322.232"
			]
		}
	);

	it('test mocking',function(done){
		mockRequest(app)
		.get('/abc')
		.expect(/wordk/,'asd',done)
	})
})