
const fastify = require('fastify')
const path = require('path')

const app = fastify()

// MIDDLE WARES
app.register(require('fastify-static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/',
})

app.register(require('fastify-jwt'), {
  secret: 'supersecret'
})


// ROUTES
app.post('/signin', async (req, reply) => {
  // some code
  const payload = { name: 'matt' }
  const token = app.jwt.sign({ payload })
  reply.send({ token })
})


app.get('/protected', async (req, reply) => {
    await req.jwtVerify()
    reply.send('Only authorized can view')
  })

  app.get('/unprotected', (req, reply) => {
    reply.send('Anyone can view')
  })
  

app.listen(3000, err => {
  console.log('app running on port 3000')
  
  if (err) throw err
})