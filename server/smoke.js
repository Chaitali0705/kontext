// Quick smoke test for the server
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function test() {
    console.log('🧪 Testing Kontext API...\n');

    try {
        // Test 1: Health check
        console.log('1️⃣  Health check...');
        const health = await axios.get('http://localhost:3001/health');
        console.log('✅ Health:', health.data);

        // Test 2: Get contexts
        console.log('\n2️⃣  Get contexts...');
        const contexts = await axios.get(`${API_BASE}/contexts`);
        console.log('✅ Contexts:', contexts.data.data?.length || 0, 'found');

        // Test 3: Create project
        console.log('\n3️⃣  Create project...');
        const createResp = await axios.post(`${API_BASE}/projects`, {
            name: 'Smoke Test Project',
            description: 'Testing the fixed validators',
            teamSize: '1-5'
        });
        console.log('✅ Created:', createResp.data);

        // Test 4: Get project by ID
        if (createResp.data?.data?.id) {
            console.log('\n4️⃣  Get project by ID...');
            const project = await axios.get(`${API_BASE}/contexts/${createResp.data.data.id}`);
            console.log('✅ Project:', project.data.data?.name);
        }

        console.log('\n🎉 All tests passed!');
    } catch (error) {
        if (error.response) {
            console.error('❌ API Error:', error.response.status, error.response.data);
        } else {
            console.error('❌ Error:', error.message);
        }
        process.exit(1);
    }
}

test();
) 
