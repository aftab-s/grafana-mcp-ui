#!/usr/bin/env python3
"""
Demo Application for Grafana MCP Demo
Generates metrics and logs for demonstration purposes
"""

import time
import random
import logging
import json
from datetime import datetime
from flask import Flask, jsonify, request
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from werkzeug.middleware.dispatcher import DispatcherMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('/app/logs/demo-app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)

# Prometheus metrics
request_counter = Counter(
    'demo_app_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'demo_app_request_duration_seconds',
    'HTTP request duration in seconds',
    ['endpoint']
)

active_connections = Gauge(
    'demo_app_active_connections',
    'Number of active connections'
)

error_counter = Counter(
    'demo_app_errors_total',
    'Total number of errors',
    ['type']
)

# Simulated data
users = [f"user{i}" for i in range(1, 11)]
endpoints = ['/api/data', '/api/users', '/api/metrics', '/api/settings']


def log_event(level, message, **kwargs):
    """Log an event with JSON formatting"""
    log_data = {
        'timestamp': datetime.utcnow().isoformat(),
        'level': level,
        'message': message,
        **kwargs
    }
    
    if level == 'ERROR':
        logger.error(json.dumps(log_data))
    elif level == 'WARN':
        logger.warning(json.dumps(log_data))
    elif level == 'INFO':
        logger.info(json.dumps(log_data))
    else:
        logger.debug(json.dumps(log_data))


@app.before_request
def before_request():
    """Track request start time"""
    request.start_time = time.time()
    active_connections.inc()


@app.after_request
def after_request(response):
    """Track request metrics"""
    active_connections.dec()
    
    if hasattr(request, 'start_time'):
        duration = time.time() - request.start_time
        
        # Record metrics
        request_counter.labels(
            method=request.method,
            endpoint=request.path,
            status=response.status_code
        ).inc()
        
        request_duration.labels(endpoint=request.path).observe(duration)
        
        # Log request
        log_event(
            'INFO',
            f'{request.method} {request.path}',
            method=request.method,
            path=request.path,
            status=response.status_code,
            duration=f'{duration:.3f}s',
            remote_addr=request.remote_addr
        )
    
    return response


@app.route('/')
def index():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'demo-app',
        'timestamp': datetime.utcnow().isoformat()
    })


@app.route('/api/data')
def get_data():
    """Simulate data retrieval with occasional errors"""
    
    # Simulate processing time
    time.sleep(random.uniform(0.05, 0.3))
    
    # Simulate occasional errors (10% chance)
    if random.random() < 0.1:
        error_counter.labels(type='data_fetch').inc()
        log_event('ERROR', 'Failed to fetch data', error_type='database_timeout')
        return jsonify({'error': 'Database connection timeout'}), 500
    
    # Simulate slow queries (5% chance)
    if random.random() < 0.05:
        time.sleep(random.uniform(0.5, 1.5))
        log_event('WARN', 'Slow query detected', query_time='1.2s')
    
    data = {
        'records': [
            {
                'id': i,
                'value': random.randint(1, 100),
                'timestamp': datetime.utcnow().isoformat()
            }
            for i in range(10)
        ]
    }
    
    return jsonify(data)


@app.route('/api/users')
def get_users():
    """Get users list"""
    time.sleep(random.uniform(0.02, 0.15))
    
    return jsonify({
        'users': [
            {
                'id': i,
                'username': user,
                'active': random.choice([True, False])
            }
            for i, user in enumerate(users, 1)
        ]
    })


@app.route('/api/users/<int:user_id>')
def get_user(user_id):
    """Get specific user with validation"""
    time.sleep(random.uniform(0.02, 0.1))
    
    if user_id < 1 or user_id > len(users):
        error_counter.labels(type='not_found').inc()
        log_event('ERROR', f'User not found: {user_id}', user_id=user_id)
        return jsonify({'error': 'User not found'}), 404
    
    # Simulate occasional auth errors (5% chance)
    if random.random() < 0.05:
        error_counter.labels(type='auth').inc()
        log_event('ERROR', 'Invalid authentication token', user_id=user_id)
        return jsonify({'error': 'Invalid token'}), 401
    
    return jsonify({
        'id': user_id,
        'username': users[user_id - 1],
        'email': f'{users[user_id - 1]}@example.com',
        'created_at': datetime.utcnow().isoformat()
    })


@app.route('/api/settings', methods=['GET', 'PUT'])
def settings():
    """Manage settings"""
    time.sleep(random.uniform(0.03, 0.12))
    
    if request.method == 'PUT':
        # Simulate occasional validation errors (8% chance)
        if random.random() < 0.08:
            error_counter.labels(type='validation').inc()
            log_event('ERROR', 'Invalid settings payload', method='PUT')
            return jsonify({'error': 'Validation failed'}), 400
        
        log_event('INFO', 'Settings updated', method='PUT')
        return jsonify({'status': 'updated'})
    
    return jsonify({
        'theme': 'dark',
        'notifications': True,
        'language': 'en'
    })


@app.route('/metrics')
def metrics():
    """Prometheus metrics endpoint"""
    return generate_latest(), 200, {'Content-Type': CONTENT_TYPE_LATEST}


@app.route('/simulate/load')
def simulate_load():
    """Simulate various load patterns"""
    pattern = request.args.get('pattern', 'normal')
    
    if pattern == 'spike':
        # Generate spike in requests
        for _ in range(50):
            endpoint = random.choice(endpoints)
            status = random.choices([200, 500], weights=[0.7, 0.3])[0]
            request_counter.labels(
                method='GET',
                endpoint=endpoint,
                status=status
            ).inc()
        
        log_event('WARN', 'Traffic spike detected', pattern='spike', requests=50)
        
    elif pattern == 'errors':
        # Generate errors
        for _ in range(20):
            error_type = random.choice(['database', 'auth', 'validation'])
            error_counter.labels(type=error_type).inc()
            log_event('ERROR', f'Simulated {error_type} error', error_type=error_type)
    
    return jsonify({'status': 'simulation complete', 'pattern': pattern})


def generate_background_traffic():
    """Generate background traffic and logs"""
    import threading
    
    def traffic_generator():
        while True:
            try:
                # Random delay between requests
                time.sleep(random.uniform(2, 8))
                
                # Generate random request
                endpoint = random.choice(endpoints)
                method = random.choice(['GET', 'POST', 'PUT'])
                status = random.choices(
                    [200, 201, 400, 404, 500],
                    weights=[0.7, 0.1, 0.05, 0.05, 0.1]
                )[0]
                
                request_counter.labels(
                    method=method,
                    endpoint=endpoint,
                    status=status
                ).inc()
                
                # Log based on status
                if status >= 500:
                    log_event('ERROR', f'Request failed: {method} {endpoint}', status=status)
                elif status >= 400:
                    log_event('WARN', f'Client error: {method} {endpoint}', status=status)
                
                # Occasionally log info messages
                if random.random() < 0.3:
                    log_event('INFO', f'Request processed: {method} {endpoint}', status=status)
                
            except Exception as e:
                logger.error(f'Background traffic error: {e}')
    
    thread = threading.Thread(target=traffic_generator, daemon=True)
    thread.start()


if __name__ == '__main__':
    # Start background traffic generation
    generate_background_traffic()
    
    log_event('INFO', 'Demo application starting', port=8080)
    
    # Run Flask app
    app.run(host='0.0.0.0', port=8080, debug=False)
