const Joi = require('joi');

// Common schema parts
const id = Joi.string().uuid();
const email = Joi.string().email().required();
const password = Joi.string()
  .min(8)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
  .message('Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character');
const username = Joi.string().alphanum().min(3).max(30).required();
const name = Joi.string().min(2).max(50);
const isActive = Joi.boolean();
const createdAt = Joi.date();
const updatedAt = Joi.date();

// Auth schemas
const userRegistration = Joi.object({
  email,
  password: password.required(),
  firstName: name.required(),
  lastName: name.required()
});

const userLogin = Joi.object({
  email,
  password: Joi.string().required()
});

// User schemas
const userCreate = Joi.object({
  email,
  password: password.required(),
  username,
  firstName: name.required(),
  lastName: name.required(),
  isActive: isActive.default(true)
});

const userUpdate = Joi.object({
  email,
  password: password.optional(),
  username,
  firstName: name,
  lastName: name,
  isActive
}).min(1);

// Role schemas
const roleCreate = Joi.object({
  name: Joi.string().required().min(2).max(50),
  description: Joi.string().max(200),
  isActive: isActive.default(true)
});

const roleUpdate = Joi.object({
  name: Joi.string().min(2).max(50),
  description: Joi.string().max(200),
  isActive
}).min(1);

// Permission schemas
const permissionCreate = Joi.object({
  name: Joi.string().required().min(2).max(50),
  description: Joi.string().max(200),
  resource: Joi.string().required(),
  action: Joi.string().required().valid('create', 'read', 'update', 'delete', 'manage'),
  attributes: Joi.array().items(Joi.string()),
  isActive: isActive.default(true)
});

const permissionUpdate = Joi.object({
  name: Joi.string().min(2).max(50),
  description: Joi.string().max(200),
  resource: Joi.string(),
  action: Joi.string().valid('create', 'read', 'update', 'delete', 'manage'),
  attributes: Joi.array().items(Joi.string()),
  isActive
}).min(1);

// Role-Permission schemas
const rolePermissionsUpdate = Joi.object({
  permissionIds: Joi.array().items(id).min(1).required()
});

// User-Role schemas
const userRolesUpdate = Joi.object({
  roleIds: Joi.array().items(id).min(1).required()
});

module.exports = {
  userRegistration,
  userLogin,
  userCreate,
  userUpdate,
  roleCreate,
  roleUpdate,
  permissionCreate,
  permissionUpdate,
  rolePermissionsUpdate,
  userRolesUpdate
};
