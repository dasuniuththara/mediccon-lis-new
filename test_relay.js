async function testSync() {
    console.log('🛰️  Testing Relay Connectivity (No DB Mode)...');
    const relayUrl = 'https://web-app-jet-three.vercel.app/api/sync-relay';
    
    // Get facility ID (mocked)
    const nodeId = 'NODE-DIAGNOSTIC-TEST';
    
    // Test with dummy data
    const stampedData = [
        { id: 'TEST-1', name: 'Relay Health Check', code: 'SYNC-OK', node_id: nodeId }
    ];
    
    console.log(`📡 Sending ${stampedData.length} test rows to relay...`);
    
    try {
        const response = await fetch(relayUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: 'test_catalog', data: stampedData })
        });
        
        const result = await response.json();
        if (response.ok) {
            console.log('✅ RELAY SUCCESS:', result);
        } else {
            console.error('❌ RELAY REJECTION:', result);
        }
    } catch (e) {
        console.error('❌ FETCH FAILURE:', e.message);
    }
}

testSync();
