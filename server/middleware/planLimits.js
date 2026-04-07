import { PLAN_LIMITS } from '../config/plans.js';

const RESOURCE_MODEL_MAP = {
  servers: 'server',
  emails: 'emailAccount',
  domains: 'domain',
  databases: 'database',
};

export function checkLimit(resourceType) {
  return async (req, res, next) => {
    try {
      const user = await req.prisma.user.findUnique({
        where: { id: req.user.id },
        select: { plan: true },
      });

      const planKey = user?.plan || 'starter';
      const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.starter;
      const limit = limits[resourceType];

      if (limit === undefined) {
        return next();
      }

      const modelName = RESOURCE_MODEL_MAP[resourceType];
      if (!modelName) {
        return next();
      }

      const count = await req.prisma[modelName].count({
        where: { userId: req.user.id },
      });

      if (count >= limit) {
        return res.status(403).json({
          success: false,
          error: `Plan limit reached. Your ${planKey} plan allows ${limit} ${resourceType}. Upgrade your plan to add more.`,
        });
      }

      next();
    } catch (error) {
      console.error('Plan limit check error:', error);
      next();
    }
  };
}
