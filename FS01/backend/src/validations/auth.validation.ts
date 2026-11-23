import Joi from 'joi';
import { UserRole } from '@prisma/client';

export const authValidation = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'any.required': 'Password is required',
    }),
    firstName: Joi.string().min(2).max(100).required().messages({
      'string.min': 'First name must be at least 2 characters',
      'any.required': 'First name is required',
    }),
    lastName: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Last name must be at least 2 characters',
      'any.required': 'Last name is required',
    }),
    role: Joi.string()
      .valid(...Object.values(UserRole))
      .optional(),
    phone: Joi.string().optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  refresh: Joi.object({
    refreshToken: Joi.string().required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).required(),
  }),
};
