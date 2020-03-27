
const fastify = require('fastify')
const path = require('path')

const app = fastify()

// MIDDLE WARES
app.register(require('fastify-static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/',
})

app.register(require("fastify-jwt"), {
  secret: "supersecret"
})


// app.register(require('./fastify-plugins/auth-strategy'))

app.decorate("authenticate", async (request, reply)  => {
  try {
    await request.jwtVerify()
  } catch (err) {
    console.log(err)
    reply.send(err)
  }
  return
})

const users = {
  'admin': {
    name: 'adam',
    type: 'admin'
  },
  'manager': {
    name: 'meaghan',
    type: 'user'
  },
  'user': {
    name: 'ulrich',
    type: 'user'
  },
}

app.get('/userInfo', async (req, reply) => {
  const payload = req.user
  console.log(payload)
  console.log(users[payload.userId])
  reply.send(users[payload.userId]) 
})

// ROUTES
app.post('/signin', async (req, reply) => {
  console.log('sign in')
  console.log(req.body)
  const { id } = JSON.parse(req.body)
  console.log(id)
  const token = app.jwt.sign({ 
    data: {id: req.body.id },
    exp: Math.floor(Date.now() / 1000) + (10) // 10s
  })
  reply.send({ token })
})

app.get('/protected',{ preValidation: [app.authenticate] },  async (req, reply) => {
  reply.send('Only authorized can view')
})

app.get('/admin-only',{ preValidation: [app.authenticate] },  async (req, reply) => {
  reply.send('Only authorized can view')
})

app.get('/manager',{ preValidation: [app.authenticate] },  async (req, reply) => {
  reply.send('Only manger & admin can view')
})

app.get('/user',{ preValidation: [app.authenticate] },  async (req, reply) => {
  reply.send('Only user & admin can view')
})

app.get('/public', (req, reply) => {
  reply.send('Anyone can view')
})

app.listen(3000, err => {
  console.log('app running on port 3000')
  
  if (err) throw err
})