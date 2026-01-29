import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { generateToken } from '../utils/jwt.js';
import { authenticateRequired } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2).max(50).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
      return;
    }
    
    const { email, password, displayName } = validation.data;
    
    // Check if user exists
    const existingUser = await (prisma as any).user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const user = await (prisma as any).user.create({
      data: {
        email,
        passwordHash,
        displayName: displayName || email.split('@')[0],
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
      }
    });
    
    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });
    
    res.status(201).json({
      message: 'Registration successful',
      user,
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
      return;
    }
    
    const { email, password } = validation.data;
    
    // Find user
    const user = await (prisma as any).user.findUnique({
      where: { email }
    });
    
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    
    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/session (check current session)
router.get('/session', authenticateRequired, async (req: Request, res: Response) => {
  try {
    const user = await (prisma as any).user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
      }
    });
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// POST /api/auth/logout (client-side token removal, but can be used for logging)
router.post('/logout', authenticateRequired, (_req: Request, res: Response) => {
  // In a real app, you might want to blacklist the token here
  res.json({ message: 'Logout successful' });
});

export { router as authRouter };



