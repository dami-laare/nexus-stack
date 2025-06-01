import * as Joi from 'joi';

export const GlobalConfigValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
});
