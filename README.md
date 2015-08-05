<!-- MarkdownTOC -->

- What it is doing
- settings.json
- Example with master
- command line arguments
- Testing

<!-- /MarkdownTOC -->

# What it is doing

- Split the webhook to many server if it is needed.
- We save the request, and let us to repeat it.
- We save all the request, and when we need to repeat we can specifiy the server
- If there is master, we reply with master response! 
 

# settings.json

Example for settings.json

	[
	{
		"ip":"127.0.0.5",
		"log":"mylog1.json",
		"webhooks":[
			{
				"url":"http://requestb.in/1fdvicp1",
				"log":"mylog2.json"
			},
			{
				"url":"https://ek0fcy1x0jjm.runscope.net/abc?d",
				"log":"mylog2.json"
			}
		]
	}
	]


The proxy will always replay with 
200 OK

# Example with master

Other example with master	
	
	[
	{
		"ip":"127.0.0.5",
		"log":"mylog1.json",
		"webhooks":[
			{
				"url":"http://requestb.in/1fdvicp1",
				"log":"mylog2.json"
			},
			{
				"url":"http://httpbin.org/post",
				"log":"mylog4.json",
				"master":true
			},
			{
				"url":"https://ek0fcy1x0jjm.runscope.net/abc?d",
				"log":"mylog2.json"
			}
		]
	}
	]


The proxy will replay the same response from the master. (but still send request to all servers!)

# command line arguments

Run example:

	node replicate-proxy --help						
	node replicate-proxy --config "settings.json"	
	node replicate-proxy --watch			- Reload everytime the settings file changed.
	node replicate-proxy --repeat mylog2.json 3   Repeat request by specify file, and line
	node replicate-proxy --repeat mylog2.json 23287327832 "" by specifiy a timestamp


# Testing	

Create a settings like in the example. Use for example httpbin.org (to see the response), use master, and not master
	
	curl -i http://127.0.0.5 -XPOST -d"mosheaasjkdsahdjk=s&asdsad=vdv"

When there is no master, it should return 

	200 OK Forwarding

When there is master it should return the real answer for the server (reccomend to use httpbin.org/post)
