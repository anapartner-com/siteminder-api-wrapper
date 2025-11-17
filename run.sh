image="siteminder-api-wrapper"
case $1 in
  "build")
	  docker build --build-arg USER_UID="$(id -u)" --build-arg USER_GID="$(id -g)" --no-cache -t ${image}:latest .
    ;;
  "start")
    docker run -d --rm \
  -p 3001:3000 \
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
