#!/bin/bash
if [ -n "$1" ]; then
docker run -d --name geppetto-osb --publish=8080:8080 -e BRANCH=$1 opensourcebrain/geppetto-osb:latest
else
docker run -d --name geppetto-osb --publish=8080:8080 metacell/geppetto-osb:latest
fi
echo "wait 1 minute for server to come up and then point browser to http://0.0.0.0:8080/org.geppetto.frontend/"
echo "use logs.sh to see logs, login.sh to log into the running container, stop.sh to stop the server"
