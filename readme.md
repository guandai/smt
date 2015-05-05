===== Getting started ===

To install dependencies:
	npm install   


Install "supervisor" 
npm install -g supervisor

To run server
supervisor server.js



To make POST request from curl (add -i to see response headers, -v to see request headers)

curl -X POST -H "Content-Type: application/json" -d @file.json localhost:8081/render

curl -X POST -H "Content-Type: application/json" -d @test.json localhost:8081/render


# run server without debug port by:
sh run.sh

# run server with debug port by:
sh rundebug.sh

# to see debug content use chrome by:
sh seedebug.sh


# sent post to server by:
sh post.sh  XXXXX
# XXXXX is customerCode,  if no customer code, it will run default test json
