// Check if report templates are in database
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

async function checkTemplates() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');

        // Get report templates collection
        const db = mongoose.connection.db;
        const templatesCollection = db.collection('reporttemplates');
        
        const count = await templatesCollection.countDocuments();
        console.log('📋 Report templates in database:', count);
        
        if (count > 0) {
            const sample = await templatesCollection.findOne({});
            console.log('📄 Sample template:', sample?.name || 'Unknown');
            console.log('🔐 Sample template category:', sample?.category || 'Unknown');
        } else {
            console.log('❌ No report templates found!');
            console.log('💡 Templates need to be seeded');
        }

        await mongoose.disconnect();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkTemplates();