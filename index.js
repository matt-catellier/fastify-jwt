const fastify = require('fastify')
const path = require('path')
const {
  BadRequest,
  Unauthorized
} = require('http-errors')

const app = fastify()

// MIDDLE WARES
app.register(require('fastify-static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/',
})

const key =  "supersecret"

app.register(require("fastify-jwt"), { secret: key })


// app.register(require('./fastify-plugins/auth-strategy'))

const refreshTokens = {}

const parseAuthForToken = (request) => {
  let token
  if (request.headers && request.headers.authorization) {
    const parts = request.headers.authorization.split(' ')
    if (parts.length === 2) {
      const scheme = parts[0]
      token = parts[1]
      if (!/^Bearer$/i.test(scheme)) {
        throw new BadRequest('cannot parse auth bearer')
      }
    }
    return token
  }
  throw new BadRequest('Cannot read authorization header')
}

app.decorate("authenticated", async (request, reply)  => {
  console.log('====== authenticated ===========')
  try {
    // decode without veriftying here
    const token = parseAuthForToken(request)
    await request.jwtVerify((err) => {
      if(err) { 
        let rethrow = true
        if(err.message = 'Authorization token expired') {
          const payload = app.jwt.decode(token)
          const threeSecondsAgo =  Math.floor(new Date() / 1000) - 3
          if(payload.exp > threeSecondsAgo) { // expired less than 3 seconds ago
            throw Unauthorized('Need to refresh token')
          }
        }   
        if(rethrow) throw err 
      }
    })
  } catch (err) {
    console.log(err.name)
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

app.post('/refreshToken', (req, reply) => {
  const { refreshToken } = JSON.parse(req.body)
  
  const decoded = app.jwt.verify(refreshToken) // check refresh token still valid
  // check we have a refresh token for that user? - dont think necessary
  const token = app.jwt.sign({ id: decoded.id }, {  expiresIn: '3s' }) // create new token
  reply.send({token})

})

// ROUTES
app.post('/signin', async (req, reply) => {
  const { id } = JSON.parse(req.body)
  const token = app.jwt.sign({ id }, {  expiresIn: '3s' }) // access token shorter than refresh token
  const refreshToken = app.jwt.sign({ id }, {  expiresIn: '6s' }) // refresh token valid longer
  refreshTokens[refreshToken] = id
  reply.send({ token, refreshToken })
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