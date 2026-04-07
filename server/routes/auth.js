import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import auth from '../middleware/auth.js';
import { isProviderConfigured } from '../providers/utils.js';
import stripeProvider from '../providers/stripe.js';

const router = Router();

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    const existing = await req.prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await req.prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    // Create Stripe customer if configured
    if (isProviderConfigured('stripe')) {
      try {
        const customer = await stripeProvider.createCustomer(email, name);
        await req.prisma.user.update({
          where: { id: user.id },
          data: { stripeCustomerId: customer.id },
        });
      } catch (stripeErr) {
        console.error('Stripe customer creation failed:', stripeErr);
      }
    }

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, plan: user.plan, createdAt: user.createdAt },
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Failed to register user' });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await req.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, plan: user.plan, createdAt: user.createdAt },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Failed to login' });
  }
});

// GET /me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, plan: true, createdAt: true, updatedAt: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

// PUT /me
router.put('/me', auth, async (req, res) => {
  try {
    const { name, email } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) {
      const existing = await req.prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== req.user.id) {
        return res.status(409).json({ success: false, error: 'Email already in use' });
      }
      updateData.email = email;
    }

    const user = await req.prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: { id: true, name: true, email: true, plan: true, createdAt: true, updatedAt: true },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// PUT /password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });
    }

    const user = await req.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await req.prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    await req.prisma.activityLog.create({
      data: {
        action: 'updated',
        resource: 'password',
        details: 'Password changed',
        userId: req.user.id,
      },
    });

    res.json({ success: true, data: { message: 'Password updated successfully' } });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

export default router;
