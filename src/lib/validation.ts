import { z } from 'zod';

export const contactInfoSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  email: z.string()
    .email('Please enter a valid email address')
    .max(255, 'Email must not exceed 255 characters'),
  
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'),
  
  preferredTime: z.string()
    .min(1, 'Please select a preferred consultation time')
    .max(50, 'Preferred time must not exceed 50 characters')
});

export const boatInfoSchema = z.object({
  type: z.string().min(1, 'Please select a boat type'),
  make: z.string()
    .min(1, 'Boat make is required')
    .max(50, 'Boat make must not exceed 50 characters'),
  model: z.string()
    .min(1, 'Boat model is required') 
    .max(50, 'Boat model must not exceed 50 characters'),
  length: z.string().min(1, 'Boat length is required'),
  currentMotorBrand: z.string()
    .max(50, 'Motor brand must not exceed 50 characters'),
  currentHp: z.number()
    .min(0, 'Horsepower must be 0 or greater')
    .max(1000, 'Horsepower seems too high'),
  serialNumber: z.string()
    .max(50, 'Serial number must not exceed 50 characters'),
  controlType: z.string()
    .max(50, 'Control type must not exceed 50 characters'),
  shaftLength: z.string()
    .max(20, 'Shaft length must not exceed 20 characters')
});

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .trim();
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
};