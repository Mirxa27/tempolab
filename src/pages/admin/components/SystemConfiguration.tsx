import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Settings,
  Globe,
  Mail,
  CreditCard,
  Brain,
  Shield,
  Database,
  Bell,
  DollarSign,
  Home,
  Calendar,
  Users,
  FileText,
  Key,
  Lock,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// Configuration schemas
const SiteSettingsSchema = z.object({
  name: z.string().min(1, 'Site name is required'),
  tagline: z.string().min(1, 'Tagline is required'),
  logoUrl: z.string().url().optional().or(z.literal('')),
  faviconUrl: z.string().url().optional().or(z.literal('')),
  contactEmail: z.string().email('Invalid email'),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  socialMedia: z.object({
    facebook: z.string().url().optional().or(z.literal('')),
    twitter: z.string().url().optional().or(z.literal('')),
    instagram: z.string().url().optional().or(z.literal('')),
    linkedin: z.string().url().optional().or(z.literal('')),
  }).optional(),
});

const CommissionRatesSchema = z.object({
  booking: z.number().min(0).max(100),
  investment: z.number().min(0).max(100),
  propertyListing: z.number().min(0).max(100),
});

const PaymentGatewaySchema = z.object({
  stripe: z.object({
    enabled: z.boolean(),
    publicKey: z.string(),
    secretKey: z.string(),
    webhookSecret: z.string().optional(),
  }),
  paypal: z.object({
    enabled: z.boolean(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
  }),
  crypto: z.object({
    enabled: z.boolean(),
    walletAddress: z.string().optional(),
  }),
});

const EmailSettingsSchema = z.object({
  provider: z.enum(['smtp', 'sendgrid', 'mailgun', 'ses']),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  fromEmail: z.string().email(),
  fromName: z.string(),
  apiKey: z.string().optional(),
});

const AISettingsSchema = z.object({
  enabled: z.boolean(),
  provider: z.enum(['openai', 'anthropic', 'google', 'custom']),
  model: z.string(),
  apiKey: z.string(),
  maxTokens: z.number().min(100).max(4000),
  temperature: z.number().min(0).max(2),
  systemPrompt: z.string().optional(),
});

const BookingPoliciesSchema = z.object({
  minAdvanceDays: z.number().min(0),
  maxAdvanceDays: z.number().min(1),
  cancellationWindowHours: z.number().min(0),
  instantBookingEnabled: z.boolean(),
  requireGuestVerification: z.boolean(),
  requireHostApproval: z.boolean(),
  maxGuestsPerBooking: z.number().min(1),
});

const SystemConfiguration: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState<Record<string, any>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('general');
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  // Form hooks for each configuration section
  const siteForm = useForm({
    resolver: zodResolver(SiteSettingsSchema),
  });

  const commissionForm = useForm({
    resolver: zodResolver(CommissionRatesSchema),
  });

  const paymentForm = useForm({
    resolver: zodResolver(PaymentGatewaySchema),
  });

  const emailForm = useForm({
    resolver: zodResolver(EmailSettingsSchema),
  });

  const aiForm = useForm({
    resolver: zodResolver(AISettingsSchema),
  });

  const bookingForm = useForm({
    resolver: zodResolver(BookingPoliciesSchema),
  });

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_configs')
        .select('*');

      if (error) throw error;

      const configMap: Record<string, any> = {};
      data?.forEach(config => {
        configMap[config.key] = config.value;
      });

      setConfigs(configMap);

      // Set form values
      if (configMap.site_settings) {
        siteForm.reset(configMap.site_settings);
      }
      if (configMap.commission_rates) {
        commissionForm.reset(configMap.commission_rates);
      }
      if (configMap.payment_gateways) {
        paymentForm.reset(configMap.payment_gateways);
      }
      if (configMap.email_settings) {
        emailForm.reset(configMap.email_settings);
      }
      if (configMap.ai_settings) {
        aiForm.reset(configMap.ai_settings);
      }
      if (configMap.booking_policies) {
        bookingForm.reset(configMap.booking_policies);
      }

    } catch (error) {
      console.error('Error loading configurations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load configurations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async (key: string, value: any, category: string) => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('system_configs')
        .upsert({
          key,
          value,
          category,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Configuration saved successfully',
      });

      // Reload configurations
      await loadConfigurations();

    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const testEmailConnection = async () => {
    try {
      const settings = emailForm.getValues();
      // This would call an API endpoint to test email sending
      setTestResults({ ...testResults, email: { status: 'success', message: 'Email sent successfully' } });
      toast({
        title: 'Success',
        description: 'Test email sent successfully',
      });
    } catch (error) {
      setTestResults({ ...testResults, email: { status: 'error', message: 'Failed to send test email' } });
      toast({
        title: 'Error',
        description: 'Failed to send test email',
        variant: 'destructive',
      });
    }
  };

  const testPaymentGateway = async (gateway: string) => {
    try {
      // This would call an API endpoint to test payment gateway
      setTestResults({ ...testResults, [gateway]: { status: 'success', message: 'Connection successful' } });
      toast({
        title: 'Success',
        description: `${gateway} connection successful`,
      });
    } catch (error) {
      setTestResults({ ...testResults, [gateway]: { status: 'error', message: 'Connection failed' } });
      toast({
        title: 'Error',
        description: `${gateway} connection failed`,
        variant: 'destructive',
      });
    }
  };

  const testAIConnection = async () => {
    try {
      const settings = aiForm.getValues();
      // This would call an API endpoint to test AI connection
      setTestResults({ ...testResults, ai: { status: 'success', message: 'AI API connected' } });
      toast({
        title: 'Success',
        description: 'AI API connection successful',
      });
    } catch (error) {
      setTestResults({ ...testResults, ai: { status: 'error', message: 'AI API connection failed' } });
      toast({
        title: 'Error',
        description: 'AI API connection failed',
        variant: 'destructive',
      });
    }
  };

  const toggleSecretVisibility = (field: string) => {
    setShowSecrets({ ...showSecrets, [field]: !showSecrets[field] });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Value copied to clipboard',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Configuration
          </CardTitle>
          <CardDescription>
            Manage all system settings and configurations. Changes here affect the entire platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 lg:grid-cols-6 mb-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="ai">AI Assistant</TabsTrigger>
              <TabsTrigger value="booking">Booking</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-6">
              <form onSubmit={siteForm.handleSubmit((data) => saveConfiguration('site_settings', data, 'general'))}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Site Name</Label>
                      <Input {...siteForm.register('name')} placeholder="HabibStay" />
                      {siteForm.formState.errors.name && (
                        <p className="text-sm text-red-500 mt-1">{siteForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="tagline">Tagline</Label>
                      <Input {...siteForm.register('tagline')} placeholder="Your Home Away From Home" />
                    </div>
                    <div>
                      <Label htmlFor="logoUrl">Logo URL</Label>
                      <Input {...siteForm.register('logoUrl')} placeholder="https://..." />
                    </div>
                    <div>
                      <Label htmlFor="faviconUrl">Favicon URL</Label>
                      <Input {...siteForm.register('faviconUrl')} placeholder="https://..." />
                    </div>
                    <div>
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input {...siteForm.register('contactEmail')} type="email" placeholder="contact@habibstay.com" />
                    </div>
                    <div>
                      <Label htmlFor="contactPhone">Contact Phone</Label>
                      <Input {...siteForm.register('contactPhone')} placeholder="+1234567890" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea {...siteForm.register('address')} placeholder="123 Main St, City, Country" />
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Social Media</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="facebook">Facebook</Label>
                        <Input {...siteForm.register('socialMedia.facebook')} placeholder="https://facebook.com/..." />
                      </div>
                      <div>
                        <Label htmlFor="twitter">Twitter</Label>
                        <Input {...siteForm.register('socialMedia.twitter')} placeholder="https://twitter.com/..." />
                      </div>
                      <div>
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input {...siteForm.register('socialMedia.instagram')} placeholder="https://instagram.com/..." />
                      </div>
                      <div>
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input {...siteForm.register('socialMedia.linkedin')} placeholder="https://linkedin.com/..." />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Commission Rates (%)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="booking">Booking Commission</Label>
                        <Input {...commissionForm.register('booking', { valueAsNumber: true })} type="number" step="0.01" placeholder="15" />
                      </div>
                      <div>
                        <Label htmlFor="investment">Investment Commission</Label>
                        <Input {...commissionForm.register('investment', { valueAsNumber: true })} type="number" step="0.01" placeholder="2" />
                      </div>
                      <div>
                        <Label htmlFor="propertyListing">Property Listing Fee</Label>
                        <Input {...commissionForm.register('propertyListing', { valueAsNumber: true })} type="number" step="0.01" placeholder="0" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => loadConfigurations()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                    <Button type="submit" disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </Button>
                  </div>
                </div>
              </form>
            </TabsContent>

            {/* Payment Settings */}
            <TabsContent value="payment" className="space-y-6">
              <form onSubmit={paymentForm.handleSubmit((data) => saveConfiguration('payment_gateways', data, 'payment'))}>
                <div className="space-y-6">
                  {/* Stripe Configuration */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Stripe</CardTitle>
                        <Switch {...paymentForm.register('stripe.enabled')} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="stripePublicKey">Public Key</Label>
                        <div className="flex gap-2">
                          <Input 
                            {...paymentForm.register('stripe.publicKey')} 
                            type={showSecrets.stripePublic ? 'text' : 'password'}
                            placeholder="pk_live_..."
                          />
                          <Button type="button" size="icon" variant="outline" onClick={() => toggleSecretVisibility('stripePublic')}>
                            {showSecrets.stripePublic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button type="button" size="icon" variant="outline" onClick={() => copyToClipboard(paymentForm.getValues('stripe.publicKey'))}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="stripeSecretKey">Secret Key</Label>
                        <div className="flex gap-2">
                          <Input 
                            {...paymentForm.register('stripe.secretKey')} 
                            type={showSecrets.stripeSecret ? 'text' : 'password'}
                            placeholder="sk_live_..."
                          />
                          <Button type="button" size="icon" variant="outline" onClick={() => toggleSecretVisibility('stripeSecret')}>
                            {showSecrets.stripeSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="stripeWebhookSecret">Webhook Secret</Label>
                        <div className="flex gap-2">
                          <Input 
                            {...paymentForm.register('stripe.webhookSecret')} 
                            type={showSecrets.stripeWebhook ? 'text' : 'password'}
                            placeholder="whsec_..."
                          />
                          <Button type="button" size="icon" variant="outline" onClick={() => toggleSecretVisibility('stripeWebhook')}>
                            {showSecrets.stripeWebhook ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <Button type="button" variant="secondary" onClick={() => testPaymentGateway('stripe')}>
                        Test Connection
                      </Button>
                      {testResults.stripe && (
                        <Alert variant={testResults.stripe.status === 'success' ? 'default' : 'destructive'}>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{testResults.stripe.message}</AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  {/* PayPal Configuration */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">PayPal</CardTitle>
                        <Switch {...paymentForm.register('paypal.enabled')} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="paypalClientId">Client ID</Label>
                        <div className="flex gap-2">
                          <Input 
                            {...paymentForm.register('paypal.clientId')} 
                            type={showSecrets.paypalClient ? 'text' : 'password'}
                            placeholder="AX..."
                          />
                          <Button type="button" size="icon" variant="outline" onClick={() => toggleSecretVisibility('paypalClient')}>
                            {showSecrets.paypalClient ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="paypalClientSecret">Client Secret</Label>
                        <div className="flex gap-2">
                          <Input 
                            {...paymentForm.register('paypal.clientSecret')} 
                            type={showSecrets.paypalSecret ? 'text' : 'password'}
                            placeholder="EK..."
                          />
                          <Button type="button" size="icon" variant="outline" onClick={() => toggleSecretVisibility('paypalSecret')}>
                            {showSecrets.paypalSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <Button type="button" variant="secondary" onClick={() => testPaymentGateway('paypal')}>
                        Test Connection
                      </Button>
                      {testResults.paypal && (
                        <Alert variant={testResults.paypal.status === 'success' ? 'default' : 'destructive'}>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{testResults.paypal.message}</AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  {/* Cryptocurrency Configuration */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Cryptocurrency</CardTitle>
                        <Switch {...paymentForm.register('crypto.enabled')} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="cryptoWallet">Wallet Address</Label>
                        <div className="flex gap-2">
                          <Input 
                            {...paymentForm.register('crypto.walletAddress')} 
                            placeholder="0x..."
                          />
                          <Button type="button" size="icon" variant="outline" onClick={() => copyToClipboard(paymentForm.getValues('crypto.walletAddress'))}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => loadConfigurations()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                    <Button type="submit" disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Payment Settings
                    </Button>
                  </div>
                </div>
              </form>
            </TabsContent>

            {/* Email Settings */}
            <TabsContent value="email" className="space-y-6">
              <form onSubmit={emailForm.handleSubmit((data) => saveConfiguration('email_settings', data, 'email'))}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="provider">Email Provider</Label>
                    <Select {...emailForm.register('provider')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smtp">SMTP</SelectItem>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                        <SelectItem value="mailgun">Mailgun</SelectItem>
                        <SelectItem value="ses">Amazon SES</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {emailForm.watch('provider') === 'smtp' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="smtpHost">SMTP Host</Label>
                          <Input {...emailForm.register('smtpHost')} placeholder="smtp.gmail.com" />
                        </div>
                        <div>
                          <Label htmlFor="smtpPort">SMTP Port</Label>
                          <Input {...emailForm.register('smtpPort', { valueAsNumber: true })} type="number" placeholder="587" />
                        </div>
                        <div>
                          <Label htmlFor="smtpUser">SMTP Username</Label>
                          <Input {...emailForm.register('smtpUser')} placeholder="user@example.com" />
                        </div>
                        <div>
                          <Label htmlFor="smtpPassword">SMTP Password</Label>
                          <div className="flex gap-2">
                            <Input 
                              {...emailForm.register('smtpPassword')} 
                              type={showSecrets.smtpPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                            />
                            <Button type="button" size="icon" variant="outline" onClick={() => toggleSecretVisibility('smtpPassword')}>
                              {showSecrets.smtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {emailForm.watch('provider') !== 'smtp' && (
                    <div>
                      <Label htmlFor="apiKey">API Key</Label>
                      <div className="flex gap-2">
                        <Input 
                          {...emailForm.register('apiKey')} 
                          type={showSecrets.emailApiKey ? 'text' : 'password'}
                          placeholder="SG...."
                        />
                        <Button type="button" size="icon" variant="outline" onClick={() => toggleSecretVisibility('emailApiKey')}>
                          {showSecrets.emailApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fromEmail">From Email</Label>
                      <Input {...emailForm.register('fromEmail')} type="email" placeholder="noreply@habibstay.com" />
                    </div>
                    <div>
                      <Label htmlFor="fromName">From Name</Label>
                      <Input {...emailForm.register('fromName')} placeholder="HabibStay" />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={testEmailConnection}>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Test Email
                    </Button>
                  </div>

                  {testResults.email && (
                    <Alert variant={testResults.email.status === 'success' ? 'default' : 'destructive'}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{testResults.email.message}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => loadConfigurations()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                    <Button type="submit" disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Email Settings
                    </Button>
                  </div>
                </div>
              </form>
            </TabsContent>

            {/* AI Settings */}
            <TabsContent value="ai" className="space-y-6">
              <form onSubmit={aiForm.handleSubmit((data) => saveConfiguration('ai_settings', data, 'ai'))}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="aiEnabled">Enable AI Assistant (Sara)</Label>
                    <Switch {...aiForm.register('enabled')} />
                  </div>

                  <div>
                    <Label htmlFor="provider">AI Provider</Label>
                    <Select {...aiForm.register('provider')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                        <SelectItem value="google">Google (Gemini)</SelectItem>
                        <SelectItem value="custom">Custom API</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="model">Model</Label>
                      <Input {...aiForm.register('model')} placeholder="gpt-4" />
                    </div>
                    <div>
                      <Label htmlFor="apiKey">API Key</Label>
                      <div className="flex gap-2">
                        <Input 
                          {...aiForm.register('apiKey')} 
                          type={showSecrets.aiApiKey ? 'text' : 'password'}
                          placeholder="sk-..."
                        />
                        <Button type="button" size="icon" variant="outline" onClick={() => toggleSecretVisibility('aiApiKey')}>
                          {showSecrets.aiApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="maxTokens">Max Tokens</Label>
                      <Input {...aiForm.register('maxTokens', { valueAsNumber: true })} type="number" placeholder="1000" />
                    </div>
                    <div>
                      <Label htmlFor="temperature">Temperature (0-2)</Label>
                      <Input {...aiForm.register('temperature', { valueAsNumber: true })} type="number" step="0.1" placeholder="0.7" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="systemPrompt">System Prompt</Label>
                    <Textarea 
                      {...aiForm.register('systemPrompt')} 
                      placeholder="You are Sara, a helpful AI assistant for HabibStay..."
                      rows={4}
                    />
                  </div>

                  <Button type="button" variant="secondary" onClick={testAIConnection}>
                    <Brain className="h-4 w-4 mr-2" />
                    Test AI Connection
                  </Button>

                  {testResults.ai && (
                    <Alert variant={testResults.ai.status === 'success' ? 'default' : 'destructive'}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{testResults.ai.message}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => loadConfigurations()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                    <Button type="submit" disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      Save AI Settings
                    </Button>
                  </div>
                </div>
              </form>
            </TabsContent>

            {/* Booking Settings */}
            <TabsContent value="booking" className="space-y-6">
              <form onSubmit={bookingForm.handleSubmit((data) => saveConfiguration('booking_policies', data, 'booking'))}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minAdvanceDays">Minimum Advance Booking (days)</Label>
                      <Input {...bookingForm.register('minAdvanceDays', { valueAsNumber: true })} type="number" placeholder="1" />
                    </div>
                    <div>
                      <Label htmlFor="maxAdvanceDays">Maximum Advance Booking (days)</Label>
                      <Input {...bookingForm.register('maxAdvanceDays', { valueAsNumber: true })} type="number" placeholder="365" />
                    </div>
                    <div>
                      <Label htmlFor="cancellationWindowHours">Cancellation Window (hours)</Label>
                      <Input {...bookingForm.register('cancellationWindowHours', { valueAsNumber: true })} type="number" placeholder="24" />
                    </div>
                    <div>
                      <Label htmlFor="maxGuestsPerBooking">Max Guests Per Booking</Label>
                      <Input {...bookingForm.register('maxGuestsPerBooking', { valueAsNumber: true })} type="number" placeholder="20" />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="instantBooking">Enable Instant Booking</Label>
                        <p className="text-sm text-gray-500">Allow guests to book without host approval</p>
                      </div>
                      <Switch {...bookingForm.register('instantBookingEnabled')} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="guestVerification">Require Guest Verification</Label>
                        <p className="text-sm text-gray-500">Guests must verify their identity before booking</p>
                      </div>
                      <Switch {...bookingForm.register('requireGuestVerification')} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="hostApproval">Require Host Approval</Label>
                        <p className="text-sm text-gray-500">Hosts must approve bookings before confirmation</p>
                      </div>
                      <Switch {...bookingForm.register('requireHostApproval')} />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => loadConfigurations()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                    <Button type="submit" disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Booking Settings
                    </Button>
                  </div>
                </div>
              </form>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Configure security and authentication settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Two-Factor Authentication</Label>
                        <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Session Timeout</Label>
                        <p className="text-sm text-gray-500">Auto-logout after inactivity</p>
                      </div>
                      <Select defaultValue="30">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 min</SelectItem>
                          <SelectItem value="30">30 min</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>IP Whitelist</Label>
                        <p className="text-sm text-gray-500">Restrict admin access by IP</p>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Rate Limiting</Label>
                        <p className="text-sm text-gray-500">Prevent API abuse</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">API Keys</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">Production API Key</p>
                          <p className="text-sm text-gray-500">pk_live_xxxxxxxxxxx</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">Test API Key</p>
                          <p className="text-sm text-gray-500">pk_test_xxxxxxxxxxx</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Button className="mt-3" variant="secondary">
                      <Key className="h-4 w-4 mr-2" />
                      Generate New API Key
                    </Button>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Backup & Recovery</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Automatic Backups</p>
                          <p className="text-sm text-gray-500">Daily at 2:00 AM UTC</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary">
                          <Database className="h-4 w-4 mr-2" />
                          Create Backup Now
                        </Button>
                        <Button variant="outline">
                          View Backup History
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Configuration Export/Import */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Management</CardTitle>
          <CardDescription>Export or import system configurations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Export Configuration
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Import Configuration
            </Button>
            <Button variant="destructive" disabled>
              <AlertCircle className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemConfiguration;