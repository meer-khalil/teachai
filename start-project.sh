#!/bin/bash
echo "Starting TeachAI Project..."
echo

echo "Starting Backend Server..."
cd backend && npm run dev &
BACKEND_PID=$!

echo "Starting Flask API..."
cd ../flaskApi && python app.py &
FLASK_PID=$!

echo "Starting Frontend..."
cd .. && npm start &
FRONTEND_PID=$!

echo
echo "All services are starting..."
echo "Backend: http://localhost:4000"
echo "Flask API: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo
echo "Press Ctrl+C to stop all services"
echo

# Wait for user to stop
trap "echo 'Stopping all services...'; kill $BACKEND_PID $FLASK_PID $FRONTEND_PID; exit" INT
wait
