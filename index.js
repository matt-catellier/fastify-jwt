const fastify = require('fastify')
const path = require('path')

const app = fastify()

// MIDDLE WARES
app.register(require('fastify-static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/',
})

const key =  "supersecret"

app.register(require("fastify-jwt"), { secret: key })

const refreshTokens = {}

app.decorate("authenticated", async (request, reply)  => {
  try {
    // decode without veriftying here
    await request.jwtVerify()
  } catch (err) {
    console.log('access token expired')
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
    name: 'molly',
    type: 'user'
  },
  'user': {
    name: 'ulrich',
    type: 'user'
  },
}

app.post('/refreshToken', (req, reply) => {
  const { refreshToken } = JSON.parse(req.body)

  try { 
    const decoded = app.jwt.verify(refreshToken) // check refresh token still valid
    const accessToken = app.jwt.sign({ id: decoded.id }, {  expiresIn: '3s' }) // create new access token
    reply.send({accessToken})
  } catch (err) {
    console.log('refresh token expired')
    reply.send(err)
  }
  

})

// ROUTES
app.post('/signin', async (req, reply) => {
  const { id } = JSON.parse(req.body)
  const token = app.jwt.sign({ id }, {  expiresIn: '3s' }) // access token shorter than refresh token
  const refreshToken = app.jwt.sign({ id }, {  expiresIn: '6s' }) // refresh token valid longer
  refreshTokens[refreshToken] = id
  reply.send({ token, refreshToken })
})

app.get('/userInfo', { preValidation: [app.authenticated] }, async (req, reply) => {
  console.log(req.user)
  console.log(users[req.user.id])
  reply.send(users[req.user.id]) 
})


app.get('/protected',{ preValidation: [app.authenticated] },  async (req, reply) => {
  console.log('==== route ====')
  console.log(req.user)
  reply.send({message: 'success'})
})

app.get('/admin-only',{ preValidation: [app.authenticated] },  async (req, reply) => {
  reply.send({message: 'success'})
})

app.get('/manager',{ preValidation: [app.authenticated] },  async (req, reply) => {
  reply.send({message: 'success'})
})

app.get('/user',{ preValidation: [app.authenticated] },  async (req, reply) => {
  reply.send({message: 'success'})
})

app.get('/public', (req, reply) => {
  reply.send({message: 'success'})
})

app.listen(3000, err => {
  console.log('app running on port 3000')
  
  if (err) throw err
})