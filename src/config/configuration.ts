import Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),
  DATABASE_URL: Joi.string().required(),
  DIRECT_URL: Joi.string().required(),
  SUPABASE_URL: Joi.string().required(),
  ANTHROPIC_API_KEY: Joi.string().required(),
});

export const configuration = () => ({
  port: parseInt(process.env.PORT ?? '3001', 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
});
