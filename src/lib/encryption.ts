import crypto from 'crypto';

// The encryption key must be 32 bytes (256 bits)
// In a real app, this is loaded from process.env.ENCRYPTION_KEY
// For this MVP, we use a fallback if not provided to ensure it runs
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'DBLensDefaultEncryptionKey32Bytes';
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  if (!text) return text;
  
  // Create a 16-byte initialization vector
  const iv = crypto.randomBytes(16);
  
  // Create cipher
  const cipher = crypto.createCipheriv(
    ALGORITHM, 
    Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32)), 
    iv
  );
  
  // Encrypt the text
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Get auth tag for GCM
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Return iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  if (!encryptedData) return encryptedData;
  
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) return encryptedData;
    
    const [ivHex, authTagHex, encryptedHex] = parts;
    
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32)),
      Buffer.from(ivHex, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return ''; // Return empty string on failure for security
  }
}
