const bcrypt = require('bcryptjs');

const hash = '$2b$12$NeX22WQcp/wmTLEARAJZXOpoZCtWubz./VuAU4fBFQkCE.zFCqGfK';
const password = 'admin123';

async function test() {
    const match = await bcrypt.compare(password, hash);
    const match2 = await bcrypt.compare('Admin123', hash);
}

test();
