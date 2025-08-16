import 'dotenv/config';
import { hederaService } from './services/hederaService.js';

async function testHederaConnection() {
  console.log('Testing Hedera blockchain connection...');
  
  // Check if service is initialized
  if (!hederaService.client) {
    console.error('❌ Hedera client not initialized');
    console.log('Environment variables:');
    console.log('HEDERA_ACCOUNT_ID:', process.env.HEDERA_ACCOUNT_ID ? '✓ Set' : '❌ Missing');
    console.log('HEDERA_PRIVATE_KEY:', process.env.HEDERA_PRIVATE_KEY ? '✓ Set' : '❌ Missing');
    console.log('HEDERA_NETWORK:', process.env.HEDERA_NETWORK || 'testnet (default)');
    return;
  }
  
  console.log('✅ Hedera client initialized successfully');
  console.log('Account ID:', process.env.HEDERA_ACCOUNT_ID);
  console.log('Network:', process.env.HEDERA_NETWORK || 'testnet');
  
  try {
    // Test storing a patent hash (simulation)
    console.log('\nTesting patent hash storage...');
    
    // Create a temporary test file
    const fs = await import('fs');
    const testFilePath = '/tmp/test-patent.txt';
    fs.writeFileSync(testFilePath, 'Test patent content for blockchain storage');
    
    const result = await hederaService.storePatentHash('test-patent-123', testFilePath);
    
    console.log('✅ Patent hash stored successfully:');
    console.log('Topic ID:', result.topicId);
    console.log('Message ID:', result.messageId);
    console.log('Hash:', result.hash);
    console.log('Transaction ID:', result.transactionId);
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
  } catch (error) {
    console.error('❌ Error testing Hedera service:', error.message);
  }
}

testHederaConnection().catch(console.error);
