const User = require('../models/User');

/**
 * Bootstrap the initial admin user if one does not exist
 */
const seedAdmin = async () => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const admin = new User({
        name: 'System Administrator',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });
      await admin.save();
      console.log(`[Admin Bootstrap] Default administrator created (${adminEmail})`);
    } else if (existingAdmin.role !== 'admin') {
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log(`[Admin Bootstrap] User ${adminEmail} updated to admin role`);
    } else {
      console.log(`[Admin Bootstrap] Administrator account verified (${adminEmail})`);
    }
  } catch (error) {
    console.error('[Admin Bootstrap] Error bootstrapping administrator:', error.message);
  }
};

module.exports = seedAdmin;
