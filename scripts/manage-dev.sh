#!/bin/bash

# Default port is 3000 if not provided
PORT=${2:-3000}
PID_FILE=".dev-server-$PORT.pid"

start() {
  # Check if port is already in use or PID file exists
  PIDS=$(lsof -ti:$PORT)
  if [ -n "$PIDS" ] || [ -f "$PID_FILE" ]; then
    echo "Port $PORT is already in use or PID file exists. Attempting to stop existing process..."
    stop
    sleep 2
    # Ensure the processes are dead; if still alive, force kill
    PIDS_AFTER=$(lsof -ti:$PORT)
    if [ -n "$PIDS_AFTER" ]; then
        echo "Processes $PIDS_AFTER are still running on port $PORT. Force killing..."
        kill -9 $PIDS_AFTER 2>/dev/null
        sleep 1
    fi
  fi

  echo "Starting development server on port $PORT (HTTPS)..."
  # Start the Next.js dev server in the background, detached from the terminal
  nohup env PORT=$PORT npm run dev:https > "dev-server-$PORT.log" 2>&1 &
  PID=$!
  echo $PID > "$PID_FILE"
  echo "Server started with PID $PID on port $PORT."
  echo "Logs are being written to dev-server-$PORT.log"
}

stop() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    echo "Stopping server gracefully (PID $PID) on port $PORT..."
    
    # Send SIGTERM (15) for graceful shutdown
    kill -15 $PID 2>/dev/null
    
    # Wait for the process to actually terminate, up to 5 seconds
    WAIT_TIME=0
    while kill -0 $PID 2>/dev/null && [ $WAIT_TIME -lt 5 ]; do
        sleep 1
        WAIT_TIME=$((WAIT_TIME+1))
    done
    
    if kill -0 $PID 2>/dev/null; then
       echo "Process $PID did not terminate gracefully. Force killing..."
       kill -9 $PID 2>/dev/null
    fi
    
    rm -f "$PID_FILE"
    echo "Server stopped."
  else
    echo "No PID file found for port $PORT. Attempting to find process via lsof..."
    PIDS=$(lsof -ti:$PORT)
    if [ -n "$PIDS" ]; then
      echo "Sending graceful kill (SIGTERM) to processes on port $PORT: $PIDS"
      kill -15 $PIDS 2>/dev/null
      
      sleep 2
      PIDS_AFTER=$(lsof -ti:$PORT)
      if [ -n "$PIDS_AFTER" ]; then
         echo "Processes $PIDS_AFTER did not terminate gracefully. Force killing..."
         kill -9 $PIDS_AFTER 2>/dev/null
      fi
      echo "Server(s) stopped."
    else
      echo "No process found running on port $PORT."
    fi
  fi
}

case "$1" in
  start)
    start
    ;;
  stop)
    stop
    ;;
  restart)
    stop
    sleep 2
    start
    ;;
  *)
    echo "Usage: $0 {start|stop|restart} [port]"
    echo "Example: ./scripts/manage-dev.sh start 3001"
    echo "Default port is 3000."
    exit 1
esac
