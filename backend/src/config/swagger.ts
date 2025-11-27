/**
 * @file swagger.ts
 * @description Swagger configuration for Zephyra backend API documentation.
 */

import swaggerJSDoc, { type Options } from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import type { Application } from 'express'

// Swagger definition metadata
const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'Zephyra Backend API',
    version: '1.0.0',
    description: 'API documentation for the Zephyra backend system.',
    contact: {
      name: 'Zephyra Dev Team',
      email: 'support@zephyra.io',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
}

// Swagger options
const options: Options = {
  swaggerDefinition,
  apis: ['src/routes/*.ts', 'src/controllers/*.ts', 'src/dtos/*.ts'],
}

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options)

/**
 * @description Sets up Swagger UI on the given Express app.
 * @param app Express Application instance
 */
export const setupSwagger = (app: Application): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
  console.log('📘 Swagger docs available at /api-docs')
}
