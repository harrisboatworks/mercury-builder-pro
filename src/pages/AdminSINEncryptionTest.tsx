import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Shield, Key, Lock } from 'lucide-react';
import AdminNav from '@/components/admin/AdminNav';
import { encryptSIN, decryptSIN, validateSINFormat } from '@/lib/sinEncryption';

const AdminSINEncryptionTest = () => {
  const [testSIN, setTestSIN] = useState('123-456-789');
  const [encryptedValue, setEncryptedValue] = useState('');
  const [decryptedValue, setDecryptedValue] = useState('');
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{
    keyExists?: boolean;
    encryptionWorks?: boolean;
    decryptionWorks?: boolean;
    auditLogWorks?: boolean;
    errors: string[];
  }>({ keyExists: undefined, encryptionWorks: undefined, decryptionWorks: undefined, auditLogWorks: undefined, errors: [] });

  const runComprehensiveTest = async () => {
    setTesting(true);
    const errors: string[] = [];
    const newResults: {
      keyExists?: boolean;
      encryptionWorks?: boolean;
      decryptionWorks?: boolean;
      auditLogWorks?: boolean;
      errors: string[];
    } = { errors };

    try {
      // Test 1: Check if encryption key exists
      console.log('🔍 Testing: Checking for encryption key...');
      try {
        const { data: keyData, error: keyError } = await supabase.rpc('get_sin_encryption_key');
        if (keyError) throw keyError;
        newResults.keyExists = !!keyData;
        console.log('✅ Encryption key check:', keyData);
      } catch (error: any) {
        errors.push(`Key check failed: ${error.message}`);
        newResults.keyExists = false;
        console.error('❌ Key check failed:', error);
      }

      // Test 2: Test encryption
      console.log('🔍 Testing: SIN encryption...');
      try {
        const encrypted = await encryptSIN(testSIN);
        setEncryptedValue(encrypted);
        newResults.encryptionWorks = true;
        console.log('✅ SIN encrypted successfully:', encrypted.substring(0, 20) + '...');
      } catch (error: any) {
        errors.push(`Encryption failed: ${error.message}`);
        newResults.encryptionWorks = false;
        console.error('❌ Encryption failed:', error);
      }

      // Test 3: Test decryption (admin only)
      if (encryptedValue || newResults.encryptionWorks) {
        console.log('🔍 Testing: SIN decryption...');
        try {
          const valueToDecrypt = encryptedValue || await encryptSIN(testSIN);
          const decrypted = await decryptSIN(valueToDecrypt);
          setDecryptedValue(decrypted);
          newResults.decryptionWorks = true;
          console.log('✅ SIN decrypted successfully:', decrypted);
        } catch (error: any) {
          errors.push(`Decryption failed: ${error.message}`);
          newResults.decryptionWorks = false;
          console.error('❌ Decryption failed:', error);
        }
      }

      // Test 4: Check audit log
      console.log('🔍 Testing: Audit log...');
      try {
        const { data: auditData, error: auditError } = await supabase
          .from('sin_audit_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (auditError) throw auditError;
        newResults.auditLogWorks = true;
        console.log('✅ Audit log working:', auditData?.length || 0, 'recent entries');
      } catch (error: any) {
        errors.push(`Audit log check failed: ${error.message}`);
        newResults.auditLogWorks = false;
        console.error('❌ Audit log check failed:', error);
      }

    } catch (error: any) {
      errors.push(`Test suite failed: ${error.message}`);
      console.error('❌ Test suite error:', error);
    }

    setResults(newResults);
    setTesting(false);
  };

  const testEncryption = async () => {
    if (!validateSINFormat(testSIN)) {
      setResults({ ...results, errors: ['Invalid SIN format. Must be 9 digits.'] });
      return;
    }

    setTesting(true);
    try {
      const encrypted = await encryptSIN(testSIN);
      setEncryptedValue(encrypted);
      setResults({ ...results, encryptionWorks: true, errors: [] });
    } catch (error: any) {
      setResults({ ...results, encryptionWorks: false, errors: [error.message] });
    }
    setTesting(false);
  };

  const testDecryption = async () => {
    if (!encryptedValue) {
      setResults({ ...results, errors: ['No encrypted value to decrypt. Run encryption first.'] });
      return;
    }

    setTesting(true);
    try {
      const decrypted = await decryptSIN(encryptedValue);
      setDecryptedValue(decrypted);
      setResults({ ...results, decryptionWorks: true, errors: [] });
    } catch (error: any) {
      setResults({ ...results, decryptionWorks: false, errors: [error.message] });
    }
    setTesting(false);
  };

  const StatusBadge = ({ status, label }: { status?: boolean; label: string }) => {
    if (status === undefined) return null;
    return (
      <Badge variant={status ? "default" : "destructive"} className="flex items-center gap-1">
        {status ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        {label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            SIN Encryption Testing
          </h1>
          <p className="text-muted-foreground mt-2">
            Test and verify the Social Insurance Number encryption system
          </p>
        </div>

        {/* Setup Instructions */}
        <Alert className="mb-6">
          <Key className="h-4 w-4" />
          <AlertTitle>Encryption Key Setup</AlertTitle>
          <AlertDescription>
            The SIN encryption system uses pgsodium with AES-256 deterministic encryption.
            The encryption key should be automatically created on first use by the <code>get_sin_encryption_key()</code> function.
          </AlertDescription>
        </Alert>

        {/* Comprehensive Test */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Comprehensive Security Test</CardTitle>
            <CardDescription>
              Run all SIN encryption tests to verify the system is working correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runComprehensiveTest} 
              disabled={testing}
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Run All Tests
                </>
              )}
            </Button>

            {Object.keys(results).length > 1 && (
              <div className="mt-4 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={results.keyExists} label="Encryption Key" />
                  <StatusBadge status={results.encryptionWorks} label="Encryption" />
                  <StatusBadge status={results.decryptionWorks} label="Decryption" />
                  <StatusBadge status={results.auditLogWorks} label="Audit Log" />
                </div>

                {results.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Test Failures</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1 mt-2">
                        {results.errors.map((error, idx) => (
                          <li key={idx} className="text-sm">{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Individual Tests */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Manual Encryption Test</CardTitle>
            <CardDescription>
              Test encryption and decryption with a sample SIN
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="testSIN">Test SIN (format: XXX-XXX-XXX)</Label>
              <Input
                id="testSIN"
                value={testSIN}
                onChange={(e) => setTestSIN(e.target.value)}
                placeholder="123-456-789"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use a test value like 123-456-789 (not a real SIN)
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={testEncryption} disabled={testing}>
                <Lock className="mr-2 h-4 w-4" />
                Encrypt
              </Button>
              <Button 
                onClick={testDecryption} 
                disabled={testing || !encryptedValue}
                variant="outline"
              >
                Decrypt (Admin Only)
              </Button>
            </div>

            {encryptedValue && (
              <div>
                <Label>Encrypted Value</Label>
                <div className="p-3 bg-muted rounded-md font-mono text-xs break-all">
                  {encryptedValue}
                </div>
              </div>
            )}

            {decryptedValue && (
              <div>
                <Label>Decrypted Value</Label>
                <div className="p-3 bg-muted rounded-md font-mono">
                  {decryptedValue}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Notes */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Security Features</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
              <li><strong>AES-256 Deterministic Encryption:</strong> Same SIN always produces same ciphertext for efficient searching</li>
              <li><strong>Admin-Only Decryption:</strong> Only users with admin role can decrypt SINs</li>
              <li><strong>Audit Logging:</strong> All encryption and decryption attempts are logged</li>
              <li><strong>Key Storage:</strong> Encryption keys stored securely in pgsodium.key table</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default AdminSINEncryptionTest;
