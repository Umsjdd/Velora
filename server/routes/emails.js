import { Router } from 'express';
import auth from '../middleware/auth.js';
import { checkLimit } from '../middleware/planLimits.js';
import { isProviderConfigured } from '../providers/utils.js';
import cloudflare from '../providers/cloudflare.js';

const router = Router();
router.use(auth);

// GET / - List user's email accounts
router.get('/', async (req, res) => {
  try {
    const emails = await req.prisma.emailAccount.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: emails });
  } catch (error) {
    console.error('List emails error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch email accounts' });
  }
});

// POST / - Create email account
router.post('/', checkLimit('emails'), async (req, res) => {
  try {
    const { address, domain, forwardTo } = req.body;

    if (!address || !domain) {
      return res.status(400).json({ success: false, error: 'Address and domain are required' });
    }

    let cloudflareRuleId = null;

    // Create Cloudflare email routing rule if configured
    if (isProviderConfigured('cloudflare') && forwardTo) {
      // Find the domain's Cloudflare zone
      const domainRecord = await req.prisma.domain.findFirst({
        where: { name: domain, userId: req.user.id },
      });

      if (domainRecord?.cloudflareZoneId) {
        try {
          const rule = await cloudflare.createEmailRule(domainRecord.cloudflareZoneId, {
            fromAddress: `${address}@${domain}`,
            toAddress: forwardTo,
            enabled: true,
          });
          cloudflareRuleId = rule.tag || rule.id;
        } catch (err) {
          console.error('Cloudflare email rule creation failed:', err.message);
        }
      }
    }

    const email = await req.prisma.emailAccount.create({
      data: {
        address,
        domain,
        forwardTo: forwardTo || null,
        cloudflareRuleId,
        userId: req.user.id,
      },
    });

    await req.prisma.activityLog.create({
      data: {
        action: 'created',
        resource: 'email',
        details: `Created email account "${address}@${domain}"`,
        userId: req.user.id,
      },
    });

    res.status(201).json({ success: true, data: email });
  } catch (error) {
    console.error('Create email error:', error);
    res.status(500).json({ success: false, error: 'Failed to create email account' });
  }
});

// PUT /:id - Update email account
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { forwardTo, status } = req.body;

    const existing = await req.prisma.emailAccount.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Email account not found' });
    }

    // Update Cloudflare email routing rule if applicable
    if (existing.cloudflareRuleId && isProviderConfigured('cloudflare')) {
      const domainRecord = await req.prisma.domain.findFirst({
        where: { name: existing.domain, userId: req.user.id },
      });

      if (domainRecord?.cloudflareZoneId) {
        try {
          const updates = {};
          if (forwardTo !== undefined) updates.toAddress = forwardTo || undefined;
          if (status !== undefined) updates.enabled = status === 'active';

          await cloudflare.updateEmailRule(domainRecord.cloudflareZoneId, existing.cloudflareRuleId, updates);
        } catch (err) {
          console.error('Cloudflare email rule update failed:', err.message);
        }
      }
    }

    // If adding forwarding for the first time and no rule exists, create one
    if (!existing.cloudflareRuleId && forwardTo && isProviderConfigured('cloudflare')) {
      const domainRecord = await req.prisma.domain.findFirst({
        where: { name: existing.domain, userId: req.user.id },
      });

      if (domainRecord?.cloudflareZoneId) {
        try {
          const rule = await cloudflare.createEmailRule(domainRecord.cloudflareZoneId, {
            fromAddress: `${existing.address}@${existing.domain}`,
            toAddress: forwardTo,
            enabled: status !== 'inactive',
          });
          existing.cloudflareRuleId = rule.tag || rule.id;
        } catch (err) {
          console.error('Cloudflare email rule creation failed:', err.message);
        }
      }
    }

    const updateData = {};
    if (forwardTo !== undefined) updateData.forwardTo = forwardTo;
    if (status !== undefined) updateData.status = status;
    if (existing.cloudflareRuleId && !updateData.cloudflareRuleId) {
      updateData.cloudflareRuleId = existing.cloudflareRuleId;
    }

    const email = await req.prisma.emailAccount.update({
      where: { id },
      data: updateData,
    });

    await req.prisma.activityLog.create({
      data: {
        action: 'updated',
        resource: 'email',
        details: `Updated email account "${email.address}@${email.domain}"`,
        userId: req.user.id,
      },
    });

    res.json({ success: true, data: email });
  } catch (error) {
    console.error('Update email error:', error);
    res.status(500).json({ success: false, error: 'Failed to update email account' });
  }
});

// DELETE /:id - Delete email account
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await req.prisma.emailAccount.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Email account not found' });
    }

    // Delete Cloudflare email routing rule
    if (existing.cloudflareRuleId && isProviderConfigured('cloudflare')) {
      const domainRecord = await req.prisma.domain.findFirst({
        where: { name: existing.domain, userId: req.user.id },
      });

      if (domainRecord?.cloudflareZoneId) {
        try {
          await cloudflare.deleteEmailRule(domainRecord.cloudflareZoneId, existing.cloudflareRuleId);
        } catch (err) {
          console.error('Cloudflare email rule delete failed:', err.message);
        }
      }
    }

    await req.prisma.emailAccount.delete({ where: { id } });

    await req.prisma.activityLog.create({
      data: {
        action: 'deleted',
        resource: 'email',
        details: `Deleted email account "${existing.address}@${existing.domain}"`,
        userId: req.user.id,
      },
    });

    res.json({ success: true, data: { message: 'Email account deleted' } });
  } catch (error) {
    console.error('Delete email error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete email account' });
  }
});

export default router;
