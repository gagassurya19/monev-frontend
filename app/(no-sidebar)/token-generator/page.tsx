"use client";

import React, { useState } from 'react';
import { JWTGenerator } from '@/lib/jwt-generator';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Key,
  Copy,
  ExternalLink,
  Clock,
  User,
  Shield,
  CheckCircle,
  Info
} from 'lucide-react';

export default function TokenGeneratorPage() {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [expirationMinutes, setExpirationMinutes] = useState(5);
  const [userRole, setUserRole] = useState('admin');
  const [kampus, setKampus] = useState('');
  const [fakultas, setFakultas] = useState('');
  const [prodi, setProdi] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [generatedURL, setGeneratedURL] = useState('');
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState<string>('');

  const generateToken = () => {
    if (!username.trim()) {
      alert('Please enter a username');
      return;
    }

    if (userRole !== 'admin') {
      if (!kampus.trim() || !fakultas.trim() || !prodi.trim()) {
        alert('Please enter all required fields');
        return;
      }
    }

    if (!name.trim()) {
      alert('Please enter a name');
      return;
    }

    const data = {
      username: username,
      name: name,
      expirationMinutes: expirationMinutes,
      userRole: userRole,
      kampus: kampus,
      fakultas: fakultas,
      prodi: prodi
    }

    const token = JWTGenerator.generateTestToken(data);
    const url = JWTGenerator.generateTokenURL(data);
    const info = JWTGenerator.getTokenInfo(token);

    setGeneratedToken(token);
    setGeneratedURL(url);
    setTokenInfo(info);
    setCopySuccess('');
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const openInNewTab = () => {
    if (generatedURL) {
      window.open(generatedURL, '_blank');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        title="Token Generator"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Token Generator" }
        ]}
      />
      <main className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Key className="h-12 w-12 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">JWT Token Generator</CardTitle>
              <CardDescription>
                Generate test tokens for CeLOE platform authentication
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Generator Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Generate New Token
              </CardTitle>
              <CardDescription>
                Create a JWT token for testing authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Enter username (e.g., john, admin, user123)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter name (e.g., John Doe, Admin, User123)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiration">Expiration Time</Label>
                  <Select
                    value={expirationMinutes.toString()}
                    onValueChange={(value) => setExpirationMinutes(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 minute</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="525600">1 tahun</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-role">User Role</Label>
                  <Select value={userRole} onValueChange={(value) => setUserRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">Dosen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {userRole !== 'admin' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="kampus">Kampus</Label>
                      <Select value={kampus} onValueChange={(value) => setKampus(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tub">TELYU Bandung</SelectItem>
                          <SelectItem value="tup">TELYU Purwokerto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fakultas">Fakultas</Label>
                      <Select value={fakultas} onValueChange={(value) => setFakultas(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fif">Fakultas Informatika</SelectItem>
                          <SelectItem value="fik">Fakultas Ilmu Komunikasi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prodi">Prodi</Label>
                      <Select value={prodi} onValueChange={(value) => setProdi(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="s1-informatika">S1 Informatika</SelectItem>
                          <SelectItem value="s1-komunikasi">S1 Komunikasi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              <Button onClick={generateToken} className="w-full" disabled={!username.trim()}>
                <Key className="w-4 h-4 mr-2" />
                Generate Token
              </Button>
            </CardContent>
          </Card>

          {/* Generated Token Results */}
          {generatedToken && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Generated Token
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Token Info */}
                {tokenInfo && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">{tokenInfo.payload.name}</p>
                        <p className="text-xs text-gray-500">@{tokenInfo.payload.sub}</p>
                      </div>
                      {tokenInfo.payload.admin && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium">
                          Expires in {Math.floor(tokenInfo.expiresIn / 60)}m {tokenInfo.expiresIn % 60}s
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(tokenInfo.payload.exp * 1000).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Valid Token</p>
                        <p className="text-xs text-gray-500">Ready to use</p>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Token Structure with Accordion */}
                {tokenInfo && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold">Token Structure</Label>
                      <p className="text-sm text-gray-600 mt-1">Complete JWT token breakdown with header, payload, and signature</p>
                    </div>

                    <Accordion type="multiple" defaultValue={["decoded-values"]} className="w-full">
                      {/* JSON Structure & Field Descriptions */}
                      <AccordionItem value="json-structure">
                        <AccordionTrigger className="text-sm font-medium">
                          📋 JSON Structure & Field Descriptions
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                            {/* JSON Structure */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">JSON Structure</Label>
                              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                                <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-x-auto">
                                  {JSON.stringify({
                                    header: tokenInfo.header,
                                    payload: tokenInfo.payload,
                                    signature: "HMAC SHA256 (hidden for security)"
                                  }, null, 2)}
                                </pre>
                              </div>
                            </div>

                            {/* Field Descriptions */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Field Descriptions</Label>
                              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md space-y-3">
                                <div>
                                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Header:</h4>
                                  <ul className="text-xs text-blue-800 dark:text-blue-200 mt-1 space-y-1">
                                    <li><code>alg</code>: Algorithm (HS256)</li>
                                    <li><code>typ</code>: Token Type (JWT)</li>
                                  </ul>
                                </div>

                                <div>
                                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Payload:</h4>
                                  <ul className="text-xs text-blue-800 dark:text-blue-200 mt-1 space-y-1">
                                    <li><code>sub</code>: Subject (username)</li>
                                    <li><code>name</code>: Display name</li>
                                    <li><code>admin</code>: Admin privileges</li>
                                    <li><code>exp</code>: Expiration timestamp</li>
                                    <li><code>iat</code>: Issued at timestamp</li>
                                  </ul>
                                </div>

                                <div>
                                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Signature:</h4>
                                  <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                                    HMAC SHA256 hash using SECRET_KEY
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}

                {/* Token String */}
                <div className="space-y-2">
                  <Label>JWT Token</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                      <code className="text-xs break-all">{generatedToken}</code>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedToken, 'token')}
                    >
                      {copySuccess === 'token' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Access URL */}
                <div className="space-y-2">
                  <Label>Access URL</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                      <code className="text-xs break-all">{generatedURL}</code>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedURL, 'url')}
                    >
                      {copySuccess === 'url' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openInNewTab}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
} 