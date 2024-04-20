import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/utils/generate-slug'
import { type FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

export async function createEvent(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/events',
    schema: {
      body: z.object({
        title: z.string().min(4),
        details: z.string().nullable(),
        maximumAttendees: z.number().int().positive().nullable(),
      }),
      response: {
        201: z.object({
          eventId: z.string().uuid(),
        }),
        409: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (req, res) => {
      const { title, details, maximumAttendees } = req.body

      const slug = generateSlug(title)

      const eventWithSameSlug = await prisma.event.findUnique({
        where: {
          slug,
        },
      })

      if (eventWithSameSlug) {
        return res.status(409).send({
          message: 'Slug already in use',
        })
      }

      const event = await prisma.event.create({
        data: {
          title,
          details,
          maximumAttendees,
          slug,
        },
      })

      return res.status(201).send({
        eventId: event.id,
      })
    },
  })
}
