const { spawn } = require('child_process')
const path = require('path')

console.log('🚀 Starting RailConnect Application...\n')

// Start backend server
console.log('📡 Starting backend server...')
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
})

// Wait a moment for backend to start
setTimeout(() => {
  console.log('🎨 Starting frontend development server...')
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname),
    stdio: 'inherit',
    shell: true
  })

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...')
    backend.kill('SIGINT')
    frontend.kill('SIGINT')
    process.exit(0)
  })

  frontend.on('error', (err) => {
    console.error('❌ Frontend error:', err)
  })
}, 2000)

backend.on('error', (err) => {
  console.error('❌ Backend error:', err)
})

console.log('✅ Servers starting...')
console.log('🌐 Frontend: http://localhost:5173')
console.log('🔧 Backend: http://localhost:5000')
console.log('\nPress Ctrl+C to stop both servers')
