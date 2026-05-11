// MiaGPT tool definitions — Anthropic Messages API tool_use schema.
// Hosts implement these tools by calling api.openmiami.org and feeding
// results back into the next turn as a tool_result content block.

export const queryResourcesTool = {
  name: 'query_resources',
  description: [
    'Search the OpenMiami civic resource directory.',
    'Use this whenever the user asks for help, services, or where to find',
    'something in Miami (housing, food, health, 311 issues, small business,',
    'arts, climate, etc.). Always prefer this tool over relying on memory.',
    'Return up to 8 results ordered by category match and proximity to the',
    "user's zipcode if provided.",
  ].join(' '),
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Free-text search of resource name and description.',
      },
      category: {
        type: 'string',
        enum: [
          'housing', 'food', 'health', 'mental_health', 'small_business',
          'workforce', 'education', 'youth', 'seniors', 'immigration',
          'legal', 'arts_culture', 'climate_resilience', 'transit',
          'utilities', 'civic_311', 'emergency',
        ],
        description: 'Category filter; omit for any category.',
      },
      zipcode: {
        type: 'string',
        pattern: '^\\d{5}$',
        description: 'Optional 5-digit ZIP for proximity ranking.',
      },
      language: {
        type: 'string',
        enum: ['en', 'ht', 'es', 'fr'],
        description: 'Filter to resources offering service in this language.',
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 20,
        default: 8,
      },
    },
    required: [],
  },
};

export const tools = [queryResourcesTool];
