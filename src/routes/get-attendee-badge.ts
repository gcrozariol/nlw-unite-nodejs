import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

export async function getAttendeeBadge(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/attendees/:attendeeId/badge',
    {
      schema: {
        params: z.object({
          attendeeId: z.coerce.number().int(),
        }),
        response: {
          200: z.object({
            attendee: z.object({
              id: z.number(),
              name: z.string(),
              email: z.string().email(),
              event: z.object({
                title: z.string(),
              }),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const { attendeeId } = request.params

      const attendee = await prisma.attendee.findUnique({
        select: {
          id: true,
          name: true,
          email: true,
          event: {
            select: {
              title: true,
            },
          },
        },
        where: {
          id: attendeeId,
        },
      })

      if (!attendee) {
        throw new Error('Attendee not found')
      }

      return reply.status(200).send({
        attendee: {
          id: attendee.id,
          name: attendee.name,
          email: attendee.email,
          event: {
            title: attendee.event.title,
          },
        },
      })
    },
  )
}
