image="siteminder-api-wrapper"
case $1 in
  "build")
	  docker build --build-arg USER_UID="$(id -u)" --build-arg USER_GID="$(id -g)" --no-cache -t ${image}:latest .
    ;;
  "start")
  #-p 3001:3000 \
    docker run -d --rm \
	    --network web \
  -v $(pwd)/src:/app/src \
  --name ${image} \
  ${image}:latest
    ;;
  "stop")
    docker stop ${image}
    ;;
  "logs")
    docker logs ${image} -f
    ;;
  *)
    echo "Usage: $0 {build|start|stop|logs}"
    exit 1
    ;;
esac
