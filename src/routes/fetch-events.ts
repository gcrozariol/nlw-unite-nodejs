import { prisma } from '@/lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

export async function fetchEvents(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/events',
    {
      schema: {
        summary: 'Fetch events',
        tags: ['events'],
        response: {
          200: z.object({
            events: z.array(
              z.object({
                id: z.string(),
                title: z.string(),
                details: z.string().nullable(),
                slug: z.string(),
                maximumAttendees: z.number().int().nullable(),
                attendeesCount: z.number().int(),
              }),
            ),
            total: z.number().int(),
          }),
        },
      },
    },
    async (_, reply) => {
      const [events, count] = await prisma.$transaction([
        prisma.event.findMany({
          select: {
            id: true,
            title: true,
            slug: true,
            details: true,
            maximumAttendees: true,
            _count: {
              select: {
                attendees: true,
              },
            },
          },
        }),
        prisma.event.count(),
      ])

      return reply.status(200).send({
        events: events.map((event) => ({
          id: event.id,
          title: event.title,
          details: event.details,
          slug: event.slug,
          maximumAttendees: event.maximumAttendees,
          attendeesCount: event._count.attendees,
        })),
        total: count,
      })
    },
  )
}
