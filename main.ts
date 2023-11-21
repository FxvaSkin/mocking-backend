import Fastify from 'fastify'

import { nanoid } from 'nanoid'

const fastify = Fastify()

interface User {
  id: string
  name: string
  age: number
}

const db = new Map<User['id'], User>()

fastify.get('/api/v1/users', async (request, reply) => {
  const list = [...db.entries()].map(([key, value]) => {
    return {
      id: key,
      name: value.name,
      age: value.age,
    }
  })

  reply.send(list)
})

interface GetByIdParams {
  id: string
}

fastify.get(
  '/api/v1/users/:id',
  {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
    },
  },
  async (request, reply) => {
    const { id } = request.params as GetByIdParams

    if (!db.has(id)) {
      reply.status(404).send({ error: `User with id ${id} not found` })

      return
    }

    const user = db.get(id)

    reply.send(user)
  },
)

interface CreateUserParams {
  name: string
  age: number
}

fastify.post(
  '/api/v1/users',
  {
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
      },
    },
  },
  async (request, reply) => {
    const { name, age } = request.body as CreateUserParams
    const id = nanoid()

    if (!name || !age) {
      reply.status(400)

      return
    }

    const user = { id, name, age }

    db.set(id, user)

    reply.status(201).send(user)
  },
)

fastify.delete('/api/v1/users/:id', (request, reply) => {
  const { id } = request.params as GetByIdParams

  if (!db.has(id)) {
    reply.status(404).send({ error: `User with id ${id} not found` })

    return
  }

  db.delete(id)

  reply.status(202)
})

try {
  await fastify.listen({ port: 3000 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
