// Test deletion endpoint
const axios = require('axios');

async function testDelete() {
    try {
        // First, get all contexts
        console.log('Fetching contexts...');
        const contexts = await axios.get('http://localhost:3001/api/contexts');
        console.log(`Found ${contexts.data.data.length} projects`);
        
        if (contexts.data.data.length === 0) {
            console.log('No projects to delete. Create one first.');
            return;
        }
        
        // Get the first project
        const projectId = contexts.data.data[0].id;
        console.log(`\nAttempting to delete project: ${projectId}`);
        console.log(`URL: DELETE http://localhost:3001/api/contexts/${projectId}`);
        
        // Try to delete it
        const deleteResult = await axios.delete(`http://localhost:3001/api/contexts/${projectId}`);
        console.log('\n✅ Delete successful!');
        console.log('Response:', deleteResult.data);
        
    } catch (error) {
        console.error('\n❌ Delete failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testDelete();
